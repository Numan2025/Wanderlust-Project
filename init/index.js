require("dotenv").config();
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

// Use the correct Mapbox token environment variable
const mapToken = process.env.MAPBOX_ACCESS_TOKEN; // Update to MAPBOX_ACCESS_TOKEN if you want consistency

if (!mapToken) {
  console.error("Mapbox access token is missing!");
} else {
  console.log("Mapbox access token loaded successfully");
}

const geoCodingClient = mbxGeocoding({ accessToken: mapToken });
const mongoUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log("Database connection error:", err);
  });

async function main() {
  await mongoose.connect(mongoUrl);
}

const initDB = async () => {
  try {
    console.log("Deleting existing listings...");
    await Listing.deleteMany({});

    console.log("Initializing database with new listings...");

    const updatedData = await Promise.all(
      initData.data.map(async (obj) => {
        let response;
        try {
          console.log(`Geocoding ${obj.location}, ${obj.country}`);
          response = await geoCodingClient
            .forwardGeocode({
              query: `${obj.location}, ${obj.country}`,
              limit: 1,
            })
            .send();
        } catch (error) {
          console.error(
            `Geocoding failed for ${obj.location}, ${obj.country}:`,
            error
          );
          return { ...obj, owner: "66567b03fda820235197b582", geometry: null };
        }

        const geometry = response.body.features[0].geometry || null;
        return {
          ...obj,
          owner: "66567b03fda820235197b582",
          geometry,
        };
      })
    );

    await Listing.insertMany(updatedData);
    console.log("DB is initialized successfully");
  } catch (error) {
    console.error("Error initializing DB:", error);
  }
};

initDB();
