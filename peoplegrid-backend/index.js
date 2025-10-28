// At the very top, to load our environment variables
require('dotenv').config();

// --- REQUIRES ---
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const authMiddleware = require('./middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// --- CONFIGURATIONS ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const PORT = process.env.PORT || 3001;

// --- GLOBAL MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// ===================================
// --- 1. ROUTE DEFINITIONS ---
// ===================================

// ## AUTHENTICATION ROUTES ##
const authRoutes = express.Router();

// Register
authRoutes.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length > 0) {
      return res.status(401).json({ error: 'User with that email already exists.' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, username, email',
      [username, email, passwordHash]
    );
    res.status(201).json({ message: 'User created successfully!', user: newUser.rows[0] });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login
authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user.rows[0].user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful!', token });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error during login.' });
  }
});


// ## USER PROFILE ROUTES ##
const profileRoutes = express.Router();
profileRoutes.use(authMiddleware); // Apply auth to all profile routes

// GET profile
profileRoutes.get('/', async (req, res) => {
  try {
    const userProfile = await pool.query(
      'SELECT user_id, username, email, profile_picture_url, bio, relationship_status, age, pronouns FROM users WHERE user_id = $1',
      [req.userId]
    );
    if (userProfile.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(userProfile.rows[0]);
  } catch (err) {
    console.error('Get Profile Error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// UPDATE profile
profileRoutes.put('/', async (req, res) => {
  try {
    const { username, bio, relationship_status, age, pronouns } = req.body;
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1 AND user_id != $2', [username, req.userId]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }
    const updatedUser = await pool.query(
      `UPDATE users SET username = $1, bio = $2, relationship_status = $3, age = $4, pronouns = $5 WHERE user_id = $6 RETURNING user_id, username, email, bio, relationship_status, age, pronouns`,
      [username, bio, relationship_status, age, pronouns, req.userId]
    );
    res.json({ message: 'Profile updated successfully!', user: updatedUser.rows[0] });
  } catch (err) {
    console.error('Update Profile Error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// UPLOAD profile photo
profileRoutes.post('/upload-photo', upload.single('profilePhoto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "peoplegrid_profiles" },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });
        const imageUrl = uploadResult.secure_url;
        await pool.query('UPDATE users SET profile_picture_url = $1 WHERE user_id = $2', [imageUrl, req.userId]);
        res.json({ message: 'Profile photo updated successfully!', profile_picture_url: imageUrl });
    } catch (err) {
        console.error('Photo Upload Error:', err.message);
        res.status(500).json({ error: 'Server error during photo upload.' });
    }
});


// ## POSTS ROUTES ##
const postsRoutes = express.Router();
postsRoutes.use(authMiddleware); // Apply auth to all post routes

// GET all posts
postsRoutes.get('/', async (req, res) => {
  try {
    const allPosts = await pool.query(
      `SELECT p.post_id, p.content, p.created_at, u.user_id, u.username, u.profile_picture_url 
       FROM posts p 
       JOIN users u ON p.user_id = u.user_id 
       ORDER BY p.created_at DESC`
    );
    res.json(allPosts.rows);
  } catch (err) {
    console.error('Get Posts Error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// CREATE a new post
postsRoutes.post('/', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content cannot be empty.' });
    }
    const newPost = await pool.query(
      'INSERT INTO posts (user_id, content) VALUES ($1, $2) RETURNING post_id, content, created_at',
      [req.userId, content]
    );
    res.status(201).json(newPost.rows[0]);
  } catch (err) {
    console.error('Create Post Error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE a post
postsRoutes.delete('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const loggedInUserId = req.userId;
    const postResult = await pool.query('SELECT user_id FROM posts WHERE post_id = $1', [postId]);
    
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    const postAuthorId = postResult.rows[0].user_id;

    if (postAuthorId !== loggedInUserId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }
    await pool.query('DELETE FROM posts WHERE post_id = $1', [postId]);
    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    console.error('Delete Post Error:', err.message);
    res.status(500).json({ error: 'Server error.' }); // <-- Corrected
  }
});

// ===================================
// --- 2. ROUTE MOUNTING ---
// ===================================

// Mount all the route definitions
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postsRoutes);

// Friendship routes (from separate file)
const friendshipRoutes = require('./routes/friendships');
app.use('/api/friendships', friendshipRoutes);

// User Search Route (simple enough to keep in index.js)
app.get('/api/users/search', authMiddleware, async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.userId; // Added by authMiddleware

        if (!query || String(query).trim().length < 1) {
            return res.json([]);
        }

        // Search for usernames containing the query (case-insensitive), excluding the current user
        const users = await pool.query(
            `SELECT user_id, username, profile_picture_url
             FROM users
             WHERE username ILIKE $1 AND user_id != $2
             ORDER BY username
             LIMIT 15`,
            [`%${String(query).trim()}%`, userId]
        );
        res.json(users.rows);
    } catch (err) {
        console.error('User Search Error:', err.message);
        res.status(500).json({ error: 'Server error during user search.' });
    }
});

// ===================================
// --- 3. SERVER START ---
// ===================================
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});