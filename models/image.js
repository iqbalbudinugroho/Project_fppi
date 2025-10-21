const { path } = require('express/lib/application');
const mongoose = require('mongoose');

const Imageschema = new mongoose.Schema({
    filename: String,
    path: String,
   uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Image', Imageschema);
