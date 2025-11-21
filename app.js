const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const Image = require('./models/image');
const Post = require('./models/Post');
const User = require('./models/User');
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


mongoose.connection.once('open', async () => {
    try {
        const existingUser = await User.findOne({ username: 'admin' });
        if (!existingUser) {
            const user = new User({ username: 'admin', password: 'admin123' });
            await user.save();
            console.log('✅ Default admin user created: username: admin, password: admin123');
        }
    } catch (error) {
        console.error('❌ Error seeding default admin user:', error);
    }
});
    

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'your-secret-key', // Change this to a secure secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));


// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        res.redirect('/login');
    }
}

const storage = multer.diskStorage({
destination: (req, file, cb) => cb(null, 'public/uploads'),
filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });


app.get('/', async (req, res) => {
    const image = await Image.findOne().sort({ uploadedAt: -1 });
    res.render('index', { image });
});

// Login routes
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && await user.comparePassword(password)) {
            req.session.userId = user._id;
            res.redirect('/admin');
        } else {
            res.render('login', { error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error(error);
        res.render('login', { error: 'An error occurred' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
        }
        res.redirect('/');
    });
});

app.get('/admin', requireAuth, async (req, res) => {
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

app.get('/dashboard', requireAuth, async (req, res) => {
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
