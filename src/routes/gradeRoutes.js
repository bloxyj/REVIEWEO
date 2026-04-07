const express = require('express');
const router = express.Router();
const Grade = require('../models/Grade');

router.post('/', async (req, res) => {
    try {
        const { valeur, etudiant, cours } = req.body;
        const newGrade = new Grade({ valeur, etudiant, cours });
        await newGrade.save();
        res.status(201).json(newGrade);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/student/:studentId', async (req, res) => {
    try {
        const grades = await Grade.find({ etudiant: req.params.studentId }).populate('cours');
        res.json(grades);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;