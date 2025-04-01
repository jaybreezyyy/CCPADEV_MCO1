const Resto = require("../models/Resto");

//fetch and render restaurants
exports.getAllRestos = async (req, res) => {
  try {
    const restos = await Resto.find({});
    res.render("main_page", {
      restosList: restos,
    });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.renderAddEstablishment = (req, res) => {
  res.render("add_establishment");
};

//function to save new establishment
exports.saveEstablishment = async (req, res) => {
  try {
    const resto = new Resto({
      name: req.body.name,
      storeImage: "/uploads/" + req.files["storeImage"][0].filename,
      mainImage: "/uploads/" + req.files["mainImage"][0].filename,
      description: req.body.description,
    });

    await resto.save();
    res.redirect("/");
  } catch (error) {
    console.error("Error saving establishment:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.renderEditEstablishment = async (req, res) => {
  try {
    const restoId = req.params.id;
    const resto = await Resto.findById(restoId);

    if (resto) {
      res.render("edit_establishment", { resto });
    } else {
      console.log("Restaurant not found");
      res.status(404).send("Restaurant not found");
    }
  } catch (error) {
    console.error("Error finding restaurant:", error);
    res.status(500).send("Internal Server Error");
  }
};

//function to update an establishment
exports.updateEstablishment = async (req, res) => {
  try {
    const restoId = req.body.id;
    const name = req.body.name;
    const description = req.body.description;

    const updateData = {
      name: name,
      description: description,
    };

    if (req.files["storeImage"]) {
      updateData.storeImage = "/uploads/" + req.files["storeImage"][0].filename;
    }

    if (req.files["mainImage"]) {
      updateData.mainImage = "/uploads/" + req.files["mainImage"][0].filename;
    }

    const resto = await Resto.findByIdAndUpdate(restoId, updateData);

    if (resto) {
      res.redirect("/admin_page");
    } else {
      console.log("Restaurant not found");
      res.status(404).send("Restaurant not found");
    }
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).send("Internal Server Error");
  }
};

//function to delete an establishment
exports.deleteEstablishment = async (req, res) => {
    try {
      const restoId = req.params.id;
      const resto = await Resto.findByIdAndDelete(restoId);
  
      if (resto) {
        res.redirect("/admin_page");
      } else {
        console.log("Restaurant not found");
        res.status(404).send("Restaurant not found");
      }
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      res.status(500).send("Internal Server Error");
    }
  };
