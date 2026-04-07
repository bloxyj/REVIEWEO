const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    matricule: { type: String, required: true, unique: true },
    classe: { type: String, required: true },
    photoUrl: { type: String },
}, { timestamps: true });


module.exports = mongoose.model('Student', studentSchema);