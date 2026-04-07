const express = require('express');
const router = express.Router();  
const Student = require('../models/Student'); 

router.get('/', async (req, res) => {
    try {
        const { trombinoscope, classe } = req.query;
        let query = {};
        
        if (classe) query.classe = classe;

        const students = await Student.find(query);

        if (trombinoscope === 'true') {
            const data = students.map(s => ({ nom: s.nom, prenom: s.prenom, photoUrl: s.photoUrl }));
            return res.json(data);
        }

        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;