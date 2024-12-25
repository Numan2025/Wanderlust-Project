const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      filename: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be a positive number"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        required: [true, "Geometry type is required"],
      },
      coordinates: {
        type: [Number],
        required: [true, "Coordinates are required"],
      },
    },
    category: {
      type: String,
      enum: ["Hotel", "Apartment", "Resort", "Villa", "Hostel", "Other"],
      default: "Other",
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

// Index for geospatial queries
listingSchema.index({ geometry: "2dsphere" });

// Post-hook to delete associated reviews when a listing is deleted
listingSchema.post("findOneAndDelete", async function (listing) {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
