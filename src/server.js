const mongoose = require('mongoose');
const app = require('./app');

const MONGO_URI = 'mongodb://127.0.0.1:27017/eduflow';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ Connexion à MongoDB (Docker) RÉUSSIE !");
        app.listen(3000, () => {
        console.log("🚀 L'API EduFlow écoute sur http://localhost:3000");
        });
    })
.catch(err => {
    console.error("❌ ÉCHEC de connexion à la base de données :");
    console.error(err.message);
    process.exit(1);
});