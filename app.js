const express = require("express");
const hbs = require("hbs");

//express app
const app = express();
app.set("view engine", "hbs")


//for css/imgs/etc
app.use(express.static("public"));

//listen for requests
app.listen(3000);
console.log("Listening to port 3000")
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
  res.render("edit_establishment");
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

app.get("/signup", (req, res) => {
  res.render("signup");
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
