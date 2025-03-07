const express = require("express");
const hbs = require("hbs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

//mongodb+srv://joseandreocanilao:<db_password>@cluster0.3lzzu.mongodb.net/
atlas_pw = 1234
const atlas = "mongodb+srv://joseandreocanilao:" + atlas_pw + "@cluster0.3lzzu.mongodb.net/users";

//express app
const app = express();
app.use(express.json()); // Handle JSON data
app.use(express.urlencoded({ extended: true })); // Handle form data

app.use(express.json())

// configure Multer for Image Uploads
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


//user schema
const usersSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true }, 
  avatar: { type: String, default: "default.png" },
  short_description: String
});
const User = mongoose.model("User", usersSchema);


//routing
app.get("/", (req, res) => {
  res.render("main_page")
});

app.get("/add_establishment", (req, res) => {
  res.render("add_establishment");
});

app.get("/admin_page", (req, res) => {
  res.render("admin_page");
});

app.get("/edit_establishment", (req, res) => {
  res.render("edit_establishment");
});

app.get("/edit_profile", (req, res) => {
  res.render("edit_profile");
});

app.get("/edit_review", (req, res) => {
  res.render("edit_review");
});

app.get("/login_as", (req, res) => {
  res.render("login_as");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    const check = await User.findOne({ username: name });

    if (!check) {
      return res.send("<script>alert('User not found. Please sign up.'); window.location='/login';</script>");
    }

    if (check.password === password) {
      res.redirect("/view_profile");
    } else {
      res.send("<script>alert('Wrong password. Try again.'); window.location='/login';</script>");
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.send("<script>alert('Error Logging in. Please try again.'); window.location='/login';</script>");
  }
});


app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", upload.single("avatar"), async (req, res) => {
  try {
      const { username, password, short_description } = req.body;
      const avatar = req.file ? req.file.filename : "default.png";

      // check if the username is already taken
      const existingUser = await User.findOne({ username });
      if (existingUser) {
          return res.send("<script>alert('Username already exists. Please choose another one.'); window.location='/signup';</script>");
      }

      // If unique, save user
      const newUser = new User({ username, password, avatar, short_description });
      await newUser.save();
      res.redirect("/login");
  } catch (error) {
      console.error("Signup Error:", error);
      res.send("<script>alert('Error signing up. Please try again.'); window.location='/signup';</script>");
  }
});

app.get("/view_establishment", (req, res) => {
  res.render("view_establishment");
});

app.get("/view_profile", (req, res) => {
  res.render("view_profile");
});

app.get("/visit_profile", (req, res) => {
  res.render("visit_profile");
});

app.get("/write_review", (req, res) => {
  res.render("write_review");
});

app.get("/admin_login", (req, res) => {
  res.render("admin_login");
});

app.get("/admin_page", (req, res) => {
  res.render("admin_page");
  });

//404 page
app.use((req, res) => {
  res.status(404).send("404: Page Not Found");
});
