const mongoose = require('mongoose');
const courseSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    enseignant: String,
    coefficient: { type: Number, default: 1 }
});
module.exports = mongoose.model('Course', courseSchema);