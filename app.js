const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const Image = require('./models/Image');
const Post = require('./models/Post');
const app = express();

mongoose.set('strictQuery', false);
mongoose.connect('mongodb://localhost:27017/', {
useNewUrlParser: true,
useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
console.log('✅ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
console.error('❌ MongoDB connection error:', err);
});


app.use(express.static('public'));
app.set('view engine', 'ejs');


const storage = multer.diskStorage({
destination: (req, file, cb) => cb(null, 'public/uploads'),
filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });


app.get('/', async (req, res) => {
    const image = await Image.findOne().sort({ uploadedAt: -1 });
    res.render('index', { image });
});

app.get('/admin', async (req, res) => {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render('admin', { posts });
});

app.post('/admin/upload', upload.single('image'), async (req, res) => {
    const newPost = new Post({
        title: req.body.title,
        description: req.body.description,
        imagePath: '/uploads/' + req.file.filename
    });
    await newPost.save();
    res.redirect('/admin');
});

app.post('/delete/:id', async (req, res) => {
    await Post.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
});

app.get('/dashboard', async (req, res) => {
    const images = await Image.find().sort({ uploadedAt: -1 });
    res.render('dashboard', { images });
});

app.post('/upload', upload.single('image'), async (req, res) => {
    const newImage = new Image({
        filename: req.file.filename,
        path: '/uploads/' + req.file.filename
    });
    await newImage.save();
    res.redirect('/dashboard');
});

app.post('/delete-image/:id', async (req, res) => {
    await Image.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard');
});


app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
