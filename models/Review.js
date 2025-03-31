const mongoose = require("mongoose");

const createReviewSchema = new mongoose.Schema({
    restoName: { type: String, required: true },
    username: { type: String, required: true }, // user must be logged in
    title: { type: String, required: true },
    rating: { type: Number, required: true },
    body: { type: String, required: true },
    date: { type: Date, default: Date.now },
    helpfulCount: { type: Number, default: 0 }
  });
  const Review = mongoose.model("Review", createReviewSchema);

  module.exports = Review;