const Joi = require("joi");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required().messages({
      "string.empty": "Title is required.",
    }),
    description: Joi.string().required().messages({
      "string.empty": "Description is required.",
    }),
    image: Joi.object({
      filename: Joi.string().allow(null, ""),
      url: Joi.string().uri().required().messages({
        "string.empty": "Image URL is required.",
        "string.uri": "Image URL must be a valid URI.",
      }),
    }).optional(),
    price: Joi.number().required().min(0).messages({
      "number.base": "Price must be a number.",
      "number.min": "Price must be greater than or equal to 0.",
    }),
    location: Joi.string().required().messages({
      "string.empty": "Location is required.",
    }),
    country: Joi.string().required().messages({
      "string.empty": "Country is required.",
    }),
    category: Joi.string().required().messages({
      "string.empty": "Category is required.",
    }),
  }).required().messages({
    "object.base": "Listing must be a valid object.",
  }),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5).messages({
      "number.base": "Rating must be a number.",
      "number.min": "Rating must be at least 1.",
      "number.max": "Rating must be at most 5.",
    }),
    comment: Joi.string().required().messages({
      "string.empty": "Comment is required.",
    }),
  }).required().messages({
    "object.base": "Review must be a valid object.",
  }),
});
