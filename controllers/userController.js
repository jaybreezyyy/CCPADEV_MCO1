const User = require("../models/User");

//render the "Edit Profile" page
exports.renderEditProfile = (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirect if not logged in
  }

  res.render("edit_profile", { user: req.session.user });
};

const bcrypt = require("bcryptjs");
const saltRounds = 10;

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
