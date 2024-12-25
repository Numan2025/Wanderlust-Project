const express = require("express");
const router = express.Router({ mergeParams: true });  // mergeParams to access parent route params (e.g., listing ID)
const wrapAsync = require("../utils/wrapAsync.js");
const {
  validateReview,  // Middleware to validate review data
  isLoggedIn,  // Middleware to check if user is logged in
  isReviewAuthor,  // Middleware to check if the current user is the review's author
} = require("../middlewares.js");
const reviewController = require("../controllers/reviews.js");

// Create a review
router.post(
  "/",
  isLoggedIn,  // Ensure user is logged in
  validateReview,  // Validate review data (e.g., check rating and text)
  wrapAsync(reviewController.createReview)  // Create the review asynchronously
);

// Delete a review
router.delete(
  "/:reviewId",  // The ID of the review to delete
  isLoggedIn,  // Ensure user is logged in
  isReviewAuthor,  // Ensure that the current user is the author of the review
  wrapAsync(reviewController.destroyReview)  // Destroy the review asynchronously
);

module.exports = router;
