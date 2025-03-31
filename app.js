require("dotenv").config();
const express = require("express");
const hbs = require("hbs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const bcrypt = require('bcryptjs');
const saltRounds = 10

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


//user schema - move to models folder
const usersSchema = new mongoose.Schema({
  username: { type: String, required: true , unique: true},
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
    storeImage: { type: String, required: true },
    mainImage: { type: String, required: true },
    description: { type: String, required: true},
    rating: { type: Number, default: 0},
  });
const Resto = mongoose.model("Resto", restoSchema); 

//write review schema
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
//routing - move to routes folder 
app.get("/", async (req, res) => {
  const restos = await Resto.find({});
  res.render("main_page", {
    restosList: restos
  });
});

//add establishment
app.get("/add_establishment", (req, res) => {
  res.render("add_establishment");
});
//add establishment
app.post("/save_establishment",upload.fields([{ name: 'storeImage', maxCount: 1}, {name: 'mainImage', maxCount: 1}]), (req, res)=>{
  
  const resto = new Resto({
    name: req.body.name,
    storeImage: '/uploads/' + req.files['storeImage'][0].filename,
    mainImage: '/uploads/' + req.files['mainImage'][0].filename,
    description: req.body.description
  });

  resto.save()
  .then(() => {
    res.redirect("/");
  })
  .catch((error) => {
    console.error("Error finding resto:", error);
  });
});

app.get("/edit_establishment/:id", (req, res) => {
  const restoId = req.params.id;
  Resto.findById(restoId)
  .then((resto) => {
    if(resto) {
      res.render("edit_establishment", {
        resto: resto,
      });
    } else {
      console.log("Restaurant not found");
      }
    })
    .catch((error) => {
      console.error("Error finding restaurant:", error);
    });

    /*try{
    const resto = await Resto.findById(req.params.id);
    res.render("edit_establishment", { resto: resto});
    } catch (error) {
      console.error("Error editing establishment:", error);
      res.redirect("/admin_page");
    } */
  });


app.post("/update_establishment", upload.fields([{ name: 'storeImage', maxCount: 1 }, { name: 'mainImage', maxCount: 1 }]), (req, res) => {
  const restoId = req.body.id;
  const name = req.body.name;
  const description = req.body.description;
  
  const updateData ={
    name: name,
    description: description,
  };
  
  if(req.files['storeImage']){
    updateData.storeImage = '/uploads/' + req.files['storeImage'][0].filename;
  }

  if(req.files['mainImage']){
    updateData.mainImage = '/uploads/' + req.files['mainImage'][0].filename;
  }

  Resto.findByIdAndUpdate(restoId, updateData)
    .then((resto) => {
      if (resto) {
        res.redirect("/admin_page");
      } else {
        console.log("Restaurant not found");
      }
    })
    .catch((error) => {
      console.error("Error finding Restaurant:", error);
    });
});

app.get("/delete_establishment/:id", async (req, res) => {
  const restoId = req.params.id;
  Resto.findByIdAndDelete(restoId)
  .then((resto) => {
    if(resto) {
      res.redirect("/admin_page");
    } else {
      console.log("Restaurant not found");
    }
  })
  .catch((error) => {
    console.log("Error finding restaurant", error);
  });
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
      return res.redirect("/login");
    }

    const { new_name, new_pass, short_desc } = req.body;
    const avatar = req.file ? req.file.filename : req.session.user.avatar;

    // Prepare update data
    const updateData = {
      username: new_name || req.session.user.username,
      avatar: avatar,
      short_description: short_desc || req.session.user.short_description
    };

    // Only hash and update password if a new one was provided
    if (new_pass) {
      updateData.password = await bcrypt.hash(new_pass, saltRounds);
    }

    await User.updateOne(
      { username: req.session.user.username }, 
      updateData
    );

    // Update session
    req.session.user = {
      username: new_name || req.session.user.username,
      avatar: avatar,
      short_description: short_desc || req.session.user.short_description
    };

    res.redirect("/view_profile");
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.send("<script>alert('Error updating profile. Try again.'); window.location='/edit_profile';</script>");
  }
});

app.get('/write_review/:restoName', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const restaurant = await Resto.findOne({ name: req.params.restoName });

    if (!restaurant) {
      return res.status(404).send("Restaurant not found.");
    }

    res.render('write_review', { restaurant });
  } catch (err) {
    console.error("Error fetching restaurant for review:", err);
    res.status(500).send("Internal Server Error");
  }
});




app.post("/write_review", async (req, res) => {
  try {
    

    const { restoName, title, rating, body,helpfulCount } = req.body;

    if (!restoName || !title || !rating || !body) {
      return res.send("<script>alert('All fields are required.'); window.location='/write_review';</script>");
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
      helpfulCount : 0, 
    });

    await newReview.save();

    const reviews = await Review.find({ restoName });
    const numReviews = reviews.length;
    const avgRating = reviews.reduce((acc, review) => acc + review.rating, 0) / numReviews;

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
});


app.get("/edit_review/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).send("Review not found.");
    }

    res.render("edit_review", { review });
  } catch (error) {
    console.error("Error fetching review for edit:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/edit_review/:id", async (req, res) => {
  try {
    const { title, rating, body } = req.body;

    if (!title || !body) {
      return res.send(`
        <script>
          alert('Title and review body cannot be empty');
          window.location.href = '/edit_review/${req.params.id}';
        </script>
      `);
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { title, rating: parseInt(rating), body },
      { new: true }
    );


    if (!updatedReview) {
      return res.status(404).send("Review not found.");
    }

    const reviews = await Review.find({ restoName: updatedReview.restoName });
    const numReviews = reviews.length;
    const avgRating = reviews.reduce((acc, review) => acc + review.rating, 0) / numReviews;

    await Resto.findOneAndUpdate({ name: updatedReview.restoName }, {
      rating: avgRating,
    });

    res.redirect("/view_profile");
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).send("Error updating review.");
  }
});


app.post("/delete_review/:id", async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.redirect("/view_profile");
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).send("Error deleting review.");
  }
});


app.get("/login_as", (req, res) => {
  res.render("login_as");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    if (req.session.admin) {
      req.session.destroy();
    }

    const { name, password } = req.body;
    const user = await User.findOne({ username: name });

    if (!user) {
      return res.send("<script>alert('User not found. Please sign up.'); window.location='/login';</script>");
    }

    // compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
      req.session.user = {
        username: user.username,
        avatar: user.avatar,
        short_description: user.short_description,
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

    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.send("<script>alert('Username already exists. Please choose another one.'); window.location='/signup';</script>");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user with hashed password
    const newUser = new User({ 
      username, 
      password: hashedPassword, 
      avatar, 
      short_description 
    });

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

app.get("/view_profile", async (req, res) => {
  // Check if admin is logged in and redirect to admin page
  if (req.session.admin) {
    return res.redirect("/admin_page");
  }

  
  if (!req.session.user) {
    return res.redirect("/login");
  }

  try {
    const reviews = await Review.find({ username: req.session.user.username }).sort({ date: -1 });
    
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
      admin: req.session.admin // Pass admin status to template
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).send("Internal Server Error");
  }
});



app.get("/visit_profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Fetch the user's reviews
    const reviews = await Review.find({ username: req.params.username }).sort({ date: -1 });

    // Fetch restaurant details for each review
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

app.get("/view_resto/:name", async (req, res) => {
  try {
    const resto = await Resto.findOne({ name: req.params.name });
    const reviews = await Review.find({ restoName: req.params.name }).sort({ date: -1 });

    const reviewsWithAvatars = await Promise.all(reviews.map(async (review) => {
    const user = await User.findOne({ username: review.username });
    return {
      ...review._doc,
      avatar: user ? user.avatar : "default.png", // Use default if no avatar
    };
    }));

res.render("view_resto", {
  name: resto.name,
  rating: resto.rating,
  description: resto.description,
  image: resto.mainImage,
  reviews: reviewsWithAvatars, // Updated reviews with avatars
});


    if (!resto) {
      return res.status(404).send("Restaurant not found.");
    }

   /* res.render("view_resto", {
      name: resto.name,
      rating: resto.rating,
      description: resto.description,
      image: resto.mainImage,
      reviews: reviews, // Pass reviews to the template
    });*/
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).send("Internal Server Error");
  }
});

//helpfulCount functionality
app.post("/mark_helpful/:reviewId", async (req, res) => {
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
});






app.get("/search", async (req, res) => {
  try {
    const query = req.query.query; // Get the search query from the input
    const resto = await Resto.findOne({ name: { $regex: new RegExp(query, "i") } });

    if (!resto) {
      return res.send("<script>alert('Restaurant not found!'); window.location='/';</script>");
    }

    res.redirect(`/view_resto/${resto.name}`);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).send("Internal Server Error");
  }
});


//404 page
app.use((req, res) => {
  res.status(404).send("404: Page Not Found");
});
