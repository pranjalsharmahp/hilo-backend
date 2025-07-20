const express = require('express');
const router = express.Router();
const { pool } = require('../db/db');
const upload = require('../utils/multer');
const { uploadToCloudinary } = require('../utils/cloudinary');


router.post('/register-user', async (req, res) => {
  const { email, name, profile_url } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  try {
    // Try inserting user
    await pool.query(
      'INSERT INTO users (email, name, profile_url) VALUES ($1, $2, $3)',
      [email, name, profile_url]
    );
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    // If email already exists
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('User registration error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Multer
router.post("/profile-picture/:email", upload.single('profile'), async (req, res) => {
  const { email } = req.params;
  const result = await uploadToCloudinary(req.file.path, 'profile');
  const imageUrl = result.secure_url;
  await pool.query(
    'UPDATE users SET profile_url = $1 WHERE email = $2',
    [imageUrl, email]
  );
  res.json({ "profile_url": imageUrl });
})

router.get('/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, email, name, profile_url FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;


/*
{
  "asset_id": "aabbccddeeff112233",
  "public_id": "uploads/12345_myphoto",
  "version": 1718216000,
  "version_id": "1a2b3c4d5e6f",
  "signature": "abcd1234e5f678gg",
  "width": 1200,
  "height": 800,
  "format": "jpg",
  "resource_type": "image",
  "created_at": "2024-06-13T07:33:37Z",
  "tags": [],
  "bytes": 250000,
  "type": "upload",
  "etag": "abcdef1234567890",
  "placeholder": false,
  "url": "http://res.cloudinary.com/your_cloud_name/image/upload/v1718216000/uploads/12345_myphoto.jpg",
  "secure_url": "https://res.cloudinary.com/your_cloud_name/image/upload/v1718216000/uploads/12345_myphoto.jpg",
  "folder": "uploads",
  "original_filename": "myphoto"
}

*/