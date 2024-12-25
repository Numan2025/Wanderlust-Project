const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middlewares.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");

// Set up multer for image uploads with additional validation
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  }
});

// Route definitions
router
  .route("/")
  .get(wrapAsync(listingController.index)) // Display all listings
  .post(
    isLoggedIn,
    upload.single("listing[image]"), // Handle image upload
    validateListing, // Validate listing input data
    wrapAsync(listingController.createListing) // Create a new listing
  );

// Render the form for creating a new listing
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Filter and search routes
router.get("/filter/:id", wrapAsync(listingController.filter)); // Filter listings by criteria
router.get("/search", wrapAsync(listingController.search)); // Search listings by query

// Routes for individual listings
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing)) // Display a specific listing
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"), // Handle image upload for updating listing
    validateListing, // Validate updated input data
    wrapAsync(listingController.updateListing) // Update a listing
  )
  .delete(
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.destroyListing) // Delete a listing
  );

// Render the edit form for a specific listing
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

// Reserve a listing
router.get("/:id/reservelisting", isLoggedIn, wrapAsync(listingController.reserveListing));

module.exports = router;
