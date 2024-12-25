const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAPBOX_ACCESS_TOKEN;  // Ensure the correct environment variable is used
const geoCodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  try {
    let allListings = await Listing.find();
    res.render("./listings/index.ejs", { allListings });
  } catch (error) {
    console.error(error);
    req.flash("error", "Error fetching listings.");
    res.redirect("/");
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  try {
    let { id } = req.params;
    let listing = await Listing.findById(id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
  } catch (error) {
    console.error(error);
    req.flash("error", "Error occurred while fetching the listing.");
    res.redirect("/listings");
  }
};

module.exports.createListing = async (req, res, next) => {
  try {
    // Geocode the location
    let response = await geoCodingClient
      .forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
      .send();

    // Handle the case where no geocoding result is found
    if (!response.body.features.length) {
      req.flash("error", "Location not found!");
      return res.redirect("back"); // Redirect the user back if no location found
    }

    // Handle file upload
    let url = req.file.path;
    let filename = req.file.filename;

    // Create and save the new listing
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { filename, url };
    newListing.geometry = response.body.features[0].geometry;
    await newListing.save();

    req.flash("success", "New listing created!");
    res.redirect("/listings");
  } catch (error) {
    console.error(error);
    req.flash("error", "Error occurred while creating the listing.");
    res.redirect("/listings");
  }
};

module.exports.renderEditForm = async (req, res) => {
  try {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing you trying to edit does not exist!");
      return res.redirect("/listings");
    }

    // Modify image URL for preview
    let imageUrl = listing.image.url.replace("/upload", "/upload/w_250,h_160");

    res.render("listings/edit.ejs", { listing, imageUrl });
  } catch (error) {
    console.error(error);
    req.flash("error", "Error occurred while fetching the listing to edit.");
    res.redirect("/listings");
  }
};

module.exports.updateListing = async (req, res, next) => {
  try {
    let { id } = req.params;

    // Geocode the location again for the updated listing
    let response = await geoCodingClient
      .forwardGeocode({
        query: `${req.body.listing.location},${req.body.listing.country}`,
        limit: 1,
      })
      .send();

    req.body.listing.geometry = response.body.features[0].geometry;

    // Update the listing in the database
    let updatedListing = await Listing.findByIdAndUpdate(id, req.body.listing, { new: true });

    // If a new image file is uploaded, update the image
    if (req.file) {
      let url = req.file.path;
      let filename = req.file.filename;
      updatedListing.image = { url, filename };
    }

    await updatedListing.save();
    req.flash("success", "Listing updated!");
    res.redirect(`/listings/${id}`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Error occurred while updating the listing.");
    res.redirect(`/listings/${req.params.id}`);
  }
};

module.exports.filter = async (req, res, next) => {
  try {
    let { id } = req.params;
    let allListings = await Listing.find({ category: { $all: [id] } });

    if (allListings.length !== 0) {
      res.locals.success = `Listings filtered by ${id}!`;
      return res.render("listings/index.ejs", { allListings });
    } else {
      req.flash("error", `There are no listings for ${id}!`);
      res.redirect("/listings");
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "Error occurred while filtering listings.");
    res.redirect("/listings");
  }
};

module.exports.search = async (req, res) => {
  try {
    let input = req.query.q.trim().replace(/\s+/g, " ");
    if (!input) {
      req.flash("error", "Please enter a search query!");
      return res.redirect("/listings");
    }

    let data = input.split("");
    let element = "";
    let flag = false;

    // Capitalize the first letter after spaces
    for (let index = 0; index < data.length; index++) {
      if (index === 0 || flag) {
        element += data[index].toUpperCase();
      } else {
        element += data[index].toLowerCase();
      }
      flag = data[index] === " ";
    }

    let allListings = await Listing.find({
      title: { $regex: element, $options: "i" },
    });

    if (allListings.length !== 0) {
      res.locals.success = "Listings searched by Title!";
      return res.render("listings/index.ejs", { allListings });
    }

    if (allListings.length === 0) {
      allListings = await Listing.find({
        category: { $regex: element, $options: "i" },
      }).sort({ _id: -1 });

      if (allListings.length !== 0) {
        res.locals.success = "Listings searched by Category!";
        return res.render("listings/index.ejs", { allListings });
      }
    }

    if (allListings.length === 0) {
      allListings = await Listing.find({
        country: { $regex: element, $options: "i" },
      }).sort({ _id: -1 });

      if (allListings.length !== 0) {
        res.locals.success = "Listings searched by Country!";
        return res.render("listings/index.ejs", { allListings });
      }
    }

    if (allListings.length === 0) {
      allListings = await Listing.find({
        location: { $regex: element, $options: "i" },
      }).sort({ _id: -1 });

      if (allListings.length !== 0) {
        res.locals.success = "Listings searched by Location!";
        return res.render("listings/index.ejs", { allListings });
      }
    }

    const intValue = parseInt(element, 10);
    const intDec = Number.isInteger(intValue);

    if (allListings.length === 0 && intDec) {
      allListings = await Listing.find({ price: { $lte: element } }).sort({
        price: 1,
      });

      if (allListings.length !== 0) {
        res.locals.success = `Listings searched by price less than Rs ${element}!`;
        return res.render("listings/index.ejs", { allListings });
      }
    }

    if (allListings.length === 0) {
      req.flash("error", "No listings found based on your search!");
      return res.redirect("/listings");
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "Error occurred while searching listings.");
    res.redirect("/listings");
  }
};

module.exports.destroyListing = async (req, res) => {
  try {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing deleted!");
    res.redirect("/listings");
  } catch (error) {
    console.error(error);
    req.flash("error", "Error occurred while deleting the listing.");
    res.redirect("/listings");
  }
};

module.exports.reserveListing = async (req, res) => {
  try {
    let { id } = req.params;
    req.flash("success", "Reservation details sent to your email!");
    res.redirect(`/listings/${id}`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Error occurred while reserving the listing.");
    res.redirect(`/listings/${req.params.id}`);
  }
};
