require("dotenv").config();
const express = require("express");
const hbs = require("hbs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const session = require("express-session");


//mongodb+srv://joseandreocanilao:<db_password>@cluster0.3lzzu.mongodb.net/
atlas_pw = 1234;
secret_key = "1234";
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

hbs.registerHelper("truncate", function (str, len) {
  if (str.length > len) {
    return str.substring(0, len) + "...";
  }
  return str;
});


//user schema - move to models folder
const usersSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true }, 
  avatar: { type: String, default: "default.png" },
  short_description: String
});
const User = mongoose.model("User", usersSchema);


const adminSchema = new mongoose.Schema({
  username: { type: String, required: true},
  password: { type:String, required: true}
});
const Admin = mongoose.model("Admin", adminSchema);

const restoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rating: { type: String},
    storeImage: { type: String, required: true },
    mainImage: { type: String, required: true },
    description: { type: String, required: true},
  });
const Resto = mongoose.model("Resto", restoSchema); 

//routing - move to routes folder 
app.get("/", async (req, res) => {
  const restos = await Resto.find({});
  res.render("main_page", {
    restosList: restos
  });
});

app.get("/add_establishment", (req, res) => {
  res.render("add_establishment");
});

app.post("/post",upload.fields([{ name: 'storeImage', maxCount: 1}, {name: 'mainImage', maxCount: 1}]), async(req, res)=>{
  try{
    const { name, description } = req.body;
    const storeImage = '/uploads/' + req.files.storeImage[0].filename;
    const mainImage = '/uploads/' + req.files.mainImage[0].filename;

    const resto = new Resto({
      name,
      storeImage,
      mainImage,
      description
    });
    await resto.save();
    console.log(resto);
    // res.send("Establishment successfully added!");
    res.redirect(("main_page"))
  }catch(error){
    console.error("Error adding establishment:", error);
    res.send("Error adding establishment.");
  }
});

app.get("/edit_establishment", (req, res) => {
  res.render("edit_establishment");
});

app.get("/edit_profile", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // redirect if not logged in
  }

  res.render("edit_profile", { user: req.session.user });
});


app.post("/edit_profile", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login"); // redirect if not logged in
    }

    const { new_name, new_pass, short_desc } = req.body;
    const avatar = req.file ? req.file.filename : req.session.user.avatar; // keep old avatar if no new one

    // update user in the database
    await User.updateOne(
      { username: req.session.user.username }, 
      { 
        username: new_name || req.session.user.username,
        password: new_pass || req.session.user.password,
        avatar: avatar,
        short_description: short_desc || req.session.user.short_description
      }
    );

    // update session with new details
    req.session.user = {
      username: new_name || req.session.user.username,
      avatar: avatar,
      short_description: short_desc || req.session.user.short_description
    };

    res.redirect("/view_profile"); // redirect to updated profile
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.send("<script>alert('Error updating profile. Try again.'); window.location='/edit_profile';</script>");
  }
});

app.post("/delete_profile", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login"); // Ensure user is logged in
    }

    // delete user from the database
    await User.deleteOne({ username: req.session.user.username });

    // destroy session
    req.session.destroy(() => {
      res.redirect("/signup"); // Redirect to signup page after deletion
    });
  } catch (error) {
    console.error("Delete Profile Error:", error);
    res.send("<script>alert('Error deleting profile. Try again.'); window.location='/edit_profile';</script>");
  }
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
    // Prevent simultaneous login of both user and admin
    if (req.session.admin) {
      req.session.destroy(); // Log out admin before user login
    }

    const { name, password } = req.body;
    const check = await User.findOne({ username: name });

    if (!check) {
      return res.send("<script>alert('User not found. Please sign up.'); window.location='/login';</script>");
    }

    if (check.password === password) {
      req.session.user = {
        username: check.username,
        avatar: check.avatar,
        short_description: check.short_description,
      };

      res.redirect("/view_profile");
    } else {
      res.send("<script>alert('Wrong password. Try again.'); window.location='/login';</script>");
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.send("<script>alert('Error Logging in. Please try again.'); window.location='/login';</script>");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
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

      // if unique, save user
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
  if (req.session.admin) {
    return res.redirect("/admin_page"); // redirect to admin page if admin is logged in
  } else if (req.session.user) {
    return res.render("view_profile", { user: req.session.user, isAdmin: false });
  } else {
    return res.redirect("/login"); // redirect if no one is logged in
  }
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

app.post("/admin_login", async (req, res) => {
  try {
    // prevent simultaneous login of both admin and user
    if (req.session.user) {
      req.session.destroy(); // log out user before admin login
    }

    const { username, password } = req.body;
    console.log("Attempting login for:", username);

    const admin = await Admin.findOne({ username: username });
    console.log("Admin Found:", admin);

    if (!admin) {
      return res.send("<script>alert('Admin not found. Please check your username.'); window.location='/admin_login';</script>");
    }

    if (admin.password === password) {
      req.session.admin = { username: admin.username };
      console.log("Login Successful!");
      return res.redirect("/admin_page");
    } else {
      return res.send("<script>alert('Wrong password. Try again.'); window.location='/admin_login';</script>");
    }
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.send("<script>alert('Error logging in as admin. Try again.'); window.location='/admin_login';</script>");
  }
});

app.get("/admin_page", async (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/admin_login"); // redirect if not logged in
  }
  const establishments = await Resto.find({});
  res.render("admin_page", {
    establishmentsList: establishments, admin: req.session.admin
  });
});

app.get("/admin_logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin_login");
  });
});

//404 page
app.use((req, res) => {
  res.status(404).send("404: Page Not Found");
});
