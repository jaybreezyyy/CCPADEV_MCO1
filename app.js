require("dotenv").config();
const express = require("express");
const hbs = require("hbs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const session = require("express-session");

atlas_pw = process.env.MONGODB_PASSWORD;
secret_key = process.env.SESSION_SECRET;

//mongodb+srv://joseandreocanilao:<db_password>@cluster0.3lzzu.mongodb.net/
//atlas_pw = 1234;
//secret_key = "1234";
const atlas = "mongodb+srv://joseandreocanilao:" + atlas_pw + "@cluster0.3lzzu.mongodb.net/users";

//express app
const app = express();
app.use(express.json()); // handle JSON data
app.use(express.urlencoded({ extended: true })); // handle form data
app.use(express.json())
app.use(
  session({
    secret: secret_key, // change this to a secure secret
    resave: false,
    saveUninitialized: true,
  })
);

// configure multer for Image Uploads
const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

//for css/imgs/etc
app.use(express.static("public"));

//listen for requests
app.listen(3000);
console.log("Listening to port 3000")

//connection to mongodb
mongoose.connect(atlas)
.then(()=> {
  console.log("connected to mongodb");
})
.catch(() =>{
  console.log("connection failed");
})

app.set("view engine", "hbs")

//helper to shorten the display description
hbs.registerHelper("truncate", function (str, len) {
  if (str.length > len) {
    return str.substring(0, len) + " ...";
  }
  return str;
});

hbs.registerHelper("times", function(n, block) {
  let stars = "";
  for (let i = 0; i < n; i++) stars += block.fn(i);
  return stars;
});

hbs.registerHelper("eq", function (a, b) {
  return a === b;
});


//Models
const User = require("./models/User");
const Admin = require("./models/Admin");
const Resto = require("./models/Resto");
const Review = require("./models/Review");

//Controllers for Resto
const restoController = require("./controllers/restoController");
//get and render all restaurannts
app.get("/", restoController.getAllRestos);
//add establishment page
app.get("/add_establishment", restoController.renderAddEstablishment);
//save a new establishment to the database
app.post(
  "/save_establishment",
  upload.fields([
    { name: "storeImage", maxCount: 1 },
    { name: "mainImage", maxCount: 1 },
  ]),
  restoController.saveEstablishment
);
//render the "Edit Establishment" page
app.get("/edit_establishment/:id", restoController.renderEditEstablishment);
//update establishment
app.post(
  "/update_establishment",
  upload.fields([
    { name: "storeImage", maxCount: 1 },
    { name: "mainImage", maxCount: 1 },
  ]),
  restoController.updateEstablishment
);
//delete an establishment
app.get("/delete_establishment/:id", restoController.deleteEstablishment);
//render the "View Resto" page
app.get("/view_resto/:name", restoController.renderViewResto);
//handle restaurant search
app.get("/search", restoController.searchResto);

//Controllers for User
const userController = require("./controllers/userController");
//render the "Edit Profile" page
app.get("/edit_profile", userController.renderEditProfile);
//update the profile
app.post("/edit_profile", upload.single("avatar"), userController.updateProfile);
//render "User Login" page
app.get("/login", userController.renderLogin);
//handle user login
app.post("/login", userController.login);
//handle user logout
app.get("/logout", userController.logout);
//render the "Signup" page
app.get("/signup", userController.renderSignup);
//handle user signup
app.post("/signup", upload.single("avatar"), userController.signup);
//render the "View Profile" page
app.get("/view_profile", userController.renderViewProfile);
//render the "Login As" page
app.get("/login_as", userController.renderLoginAs);
//render the "Visit Profile" page
app.get("/visit_profile/:username", userController.visitProfile);

//Controllers for Review
const reviewController = require("./controllers/reviewController");
//render the "Write Review" page
app.get("/write_review/:restoName", reviewController.renderWriteReview);
//save new review
app.post("/write_review", reviewController.saveReview);
//render the "Edit Review" page
app.get("/edit_review/:id", reviewController.renderEditReview);
//update a review
app.post("/edit_review/:id", reviewController.updateReview);
//delete a review
app.post("/delete_review/:id", reviewController.deleteReview);
//update the helpful count of a review
app.post("/mark_helpful/:reviewId", reviewController.markHelpful);

//Controllers for Admin
const adminController = require("./controllers/adminController");
//render the "Admin Login" page
app.get("/admin_login", adminController.renderAdminLogin);
//handle admin login
app.post("/admin_login", adminController.adminLogin);
//render the "Admin Page"
app.get("/admin_page", adminController.renderAdminPage);
//handle admin logout
app.get("/admin_logout", adminController.adminLogout);

//404 page
app.use((req, res) => {
  res.status(404).send("404: Page Not Found");
});
