const Review = require("../models/Review");
const Resto = require("../models/Resto");

//function to render the "Write Review" page
exports.renderWriteReview = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const restaurant = await Resto.findOne({ name: req.params.restoName });

    if (!restaurant) {
      return res.status(404).send("Restaurant not found.");
    }

    res.render("write_review", { restaurant });
  } catch (err) {
    console.error("Error fetching restaurant for review:", err);
    res.status(500).send("Internal Server Error");
  }
};

//function to save a new review
exports.saveReview = async (req, res) => {
  try {
    const { restoName, title, rating, body } = req.body;

    if (!restoName || !title || !rating || !body) {
      return res.send(
        "<script>alert('All fields are required.'); window.location='/write_review';</script>"
      );
    }

    if (!req.session.user) {
      return res.status(401).send("You must be logged in to post a review.");
    }

    const newReview = new Review({
      restoName,
      title,
      rating: parseInt(rating),
      body,
      username: req.session.user.username,
      helpfulCount: 0,
    });

    await newReview.save();

    //recalculate average rating for the restaurant
    const reviews = await Review.find({ restoName });
    const numReviews = reviews.length;
    const avgRating =
      reviews.reduce((acc, review) => acc + review.rating, 0) / numReviews;

    const restaurant = await Resto.findOne({ name: restoName });
    if (!restaurant) {
      return res.status(404).send("Restaurant not found.");
    }

    await Resto.findByIdAndUpdate(restaurant._id, {
      rating: avgRating,
    });

    console.log("Review Saved:", newReview);

    res.redirect(`/view_resto/${restoName}`);
  } catch (error) {
    console.error("Error saving review:", error);
    res.status(500).send("Error submitting review.");
  }
};

//function to render the "Edit Review" page
exports.renderEditReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).send("Review not found.");
    }

    //check if the logged-in user is author of the review
    if (review.username !== req.session.user?.username) {
      return res.send(
        "<script>alert('You can only edit your own reviews.'); window.location='/view_profile';</script>"
      );
    }

    res.render("edit_review", { review });
  } catch (error) {
    console.error("Error fetching review for edit:", error);
    res.status(500).send("Internal Server Error");
  }
};

//function to update a review
exports.updateReview = async (req, res) => {
  try {
    const { title, rating, body } = req.body;

    if (!title || !body) {
      return res.send(
        `<script>alert('Title and review body cannot be empty'); window.location.href = '/edit_review/${req.params.id}';</script>`
      );
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).send("Review not found.");
    }

    //check if the logged-in user is the author of the review
    if (review.username !== req.session.user?.username) {
      return res.status(403).send("You can only edit your own reviews.");
    }

    //update the review
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { title, rating: parseInt(rating), body },
      { new: true }
    );

    //recalculate the average rating of the restaurant
    const reviews = await Review.find({ restoName: updatedReview.restoName });
    const numReviews = reviews.length;
    const avgRating =
      reviews.reduce((acc, review) => acc + review.rating, 0) / numReviews;

    await Resto.findOneAndUpdate(
      { name: updatedReview.restoName },
      { rating: avgRating }
    );

    res.redirect("/view_profile");
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).send("Error updating review.");
  }
};

//function to delete review
exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).send("Review not found.");
    }

    res.redirect("/view_profile");
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).send("Error deleting review.");
  }
};

//function to update the helpful count of a review
exports.markHelpful = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).send("Review not found");
    }

    review.helpfulCount += 1;
    await review.save();

    res.redirect("back");
  } catch (error) {
    console.error("Error updating helpful count:", error);
    res.status(500).send("Internal Server Error");
  }
};
