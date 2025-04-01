const User = require("../models/User");
const Review = require("../models/Review");
const Resto = require("../models/Resto");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

//render the "Edit Profile" page
exports.renderEditProfile = (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirect if not logged in
  }

  res.render("edit_profile", { user: req.session.user });
};

//function to update the user's profile
exports.updateProfile = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const { new_name, new_pass, short_desc } = req.body;
    const avatar = req.file ? req.file.filename : req.session.user.avatar;

    //prepare update data
    const updateData = {
      username: new_name || req.session.user.username,
      avatar: avatar,
      short_description: short_desc || req.session.user.short_description,
    };

    //only hash and update password if a new one was provided
    if (new_pass) {
      updateData.password = await bcrypt.hash(new_pass, saltRounds);
    }

    await User.updateOne({ username: req.session.user.username }, updateData);

    //update session
    req.session.user = {
      username: new_name || req.session.user.username,
      avatar: avatar,
      short_description: short_desc || req.session.user.short_description,
    };

    res.redirect("/view_profile");
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.send(
      "<script>alert('Error updating profile. Try again.'); window.location='/edit_profile';</script>"
    );
  }
};

//function to render the "Login" page
exports.renderLogin = (req, res) => {
  res.render("login");
};

//function to handle user login
exports.login = async (req, res) => {
  try {
    //destroy admin session if exists
    if (req.session.admin) {
      req.session.destroy();
    }

    const { name, password } = req.body;
    const user = await User.findOne({ username: name });

    if (!user) {
      return res.send(
        "<script>alert('User not found. Please sign up.'); window.location='/login';</script>"
      );
    }

    //compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      req.session.user = {
        username: user.username,
        avatar: user.avatar,
        short_description: user.short_description,
      };
      res.redirect("/view_profile");
    } else {
      res.send(
        "<script>alert('Wrong password. Try again.'); window.location='/login';</script>"
      );
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.send(
      "<script>alert('Error Logging in. Please try again.'); window.location='/login';</script>"
    );
  }
};

//function to handle user logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};

//function to render the "Signup" page
exports.renderSignup = (req, res) => {
  res.render("signup");
};

//function to handle user signup
exports.signup = async (req, res) => {
  try {
    const { username, password, short_description } = req.body;
    const avatar = req.file ? req.file.filename : "default.png";

    //check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.send(
        "<script>alert('Username already exists. Please choose another one.'); window.location='/signup';</script>"
      );
    }

    //hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    //create new user with hashed password
    const newUser = new User({
      username,
      password: hashedPassword,
      avatar,
      short_description,
    });

    await newUser.save();
    res.redirect("/login");
  } catch (error) {
    console.error("Signup Error:", error);
    res.send(
      "<script>alert('Error signing up. Please try again.'); window.location='/signup';</script>"
    );
  }
};

//function to render the "View Profile" page
exports.renderViewProfile = async (req, res) => {
  try {
    // check if admin is logged in and redirect to admin page
    if (req.session.admin) {
      return res.redirect("/admin_page");
    }

    if (!req.session.user) {
      return res.redirect("/login");
    }

    const reviews = await Review.find({
      username: req.session.user.username,
    }).sort({ date: -1 });

    const reviewsWithDetails = await Promise.all(
      reviews.map(async (review) => {
        const resto = await Resto.findOne({ name: review.restoName });
        return {
          ...review._doc,
          restoImage: resto ? resto.mainImage : "/uploads/default.png",
        };
      })
    );

    res.render("view_profile", {
      user: req.session.user,
      reviews: reviewsWithDetails,
      admin: req.session.admin, //pass admin status to template
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).send("Internal Server Error");
  }
};

//function to render the "Login As" page
exports.renderLoginAs = (req, res) => {
  res.render("login_as");
};

//function to render the "Visit Profile" page
exports.visitProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).send("User not found.");
    }

    //fetch the user's reviews
    const reviews = await Review.find({ username: req.params.username }).sort({
      date: -1,
    });

    //fetch restaurant details for each review
    const reviewsWithDetails = await Promise.all(
      reviews.map(async (review) => {
        const resto = await Resto.findOne({ name: review.restoName });
        return {
          ...review._doc,
          restoImage: resto ? resto.mainImage : "/uploads/default.png",
        };
      })
    );

    res.render("visit_profile", { user, reviews: reviewsWithDetails });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).send("Internal Server Error");
  }
};