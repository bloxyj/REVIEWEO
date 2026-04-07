const announcementSchema = new mongoose.Schema({
    titre: { type: String, required: true },
    contenu: { type: String, required: true },
    auteur: String,
    date: { type: Date, default: Date.now }
});