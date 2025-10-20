const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const Image = require('./models/image');
const req = require('express/lib/request');
const res = require('express/lib/response');
const { path } = require('express/lib/application');

const app = express();
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/ukmDB');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.get('/', async (req, res) => {
    const Image = await Image.findOne().sort({ uploadAt: -1});
    res.render('index', { Image });
})

app.get('/admin', (req, res) => {
    res.render('admin');
})

app.post('/upload', upload.single('image'), async (req, res) => {
    const newImage = new Image({
        filename: req.file.filename,
        path: '/uploads/' + req.file.filename
    });
    await newImage.save();
    res.redirect('/');
})

app.listen(3000, () => console.log('Server running on http://localhost:3000'));