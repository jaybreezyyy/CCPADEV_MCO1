const Admin = require("../models/Admin");
const Resto = require("../models/Resto");


//function to render the "Admin Login" page
exports.renderAdminLogin = (req, res) => {
  res.render("admin_login");
};

//function to handle admin login
exports.adminLogin = async (req, res) => {
  try {
    //prevent simultaneous login of both admin and user
    if (req.session.user) {
      req.session.destroy(); //log out user before admin login
    }

    const { username, password } = req.body;
    console.log("Attempting login for:", username);

    const admin = await Admin.findOne({ username: username });
    console.log("Admin Found:", admin);

    if (!admin) {
      return res.send(
        "<script>alert('Admin not found. Please check your username.'); window.location='/admin_login';</script>"
      );
    }

    if (admin.password === password) {
      req.session.admin = { username: admin.username };
      console.log("Login Successful!");
      return res.redirect("/admin_page");
    } else {
      return res.send(
        "<script>alert('Wrong password. Try again.'); window.location='/admin_login';</script>"
      );
    }
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.send(
      "<script>alert('Error logging in as admin. Try again.'); window.location='/admin_login';</script>"
    );
  }
};

// function to render the "Admin Page"
exports.renderAdminPage = async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.redirect("/admin_login"); // Redirect if not logged in
    }

    const establishments = await Resto.find({});
    res.render("admin_page", {
      establishmentsList: establishments,
      admin: req.session.admin,
    });
  } catch (error) {
    console.error("Error rendering admin page:", error);
    res.status(500).send("Internal Server Error");
  }
};

//function to handle admin logout
exports.adminLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin_login");
  });
};
