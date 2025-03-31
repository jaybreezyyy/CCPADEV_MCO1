const mongoose = require("mongoose");

const restoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    storeImage: { type: String, required: true },
    mainImage: { type: String, required: true },
    description: { type: String, required: true},
    rating: { type: Number, default: 0},
  });
const Resto = mongoose.model("Resto", restoSchema); 

module.exports = Resto;