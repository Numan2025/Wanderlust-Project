const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middlewares.js");
const userController = require("../controllers/users.js");

router
  .route("/signup")
  .get(userController.renderSignupForm)  // Renders the signup form
  .post(wrapAsync(userController.signup));  // Handles the signup form submission

router
  .route("/login")
  .get(userController.renderLoginForm)  // Renders the login form
  .post(
    saveRedirectUrl,  // Saves the intended redirect URL before login
    passport.authenticate("local", {  // Passport's local strategy for authentication
      failureRedirect: "/login",  // Redirect to login page on failure
      failureFlash: true,  // Display flash message on failure
    }),
    userController.login  // Login logic after authentication
  );

router.get("/logout", userController.logout);  // Logs the user out

module.exports = router;
