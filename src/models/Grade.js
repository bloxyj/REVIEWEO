const mongoose = require('mongoose');
const gradeSchema = new mongoose.Schema({
    valeur: { type: Number, required: true, min: 0, max: 20 },
    etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    cours: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
});
module.exports = mongoose.model('Grade', gradeSchema);