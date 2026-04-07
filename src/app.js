const express = require('express');
const app = express();
const studentRoutes = require('./routes/studentRoutes');

app.use(express.json()); 

app.use('/students', studentRoutes); 

module.exports = app;