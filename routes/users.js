const express= require('express');
const router= express.Router();
const { pool } = require('../db/db');



router.post('/register-user', async (req, res) => {
  const { email, name, profile_url } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  try {
    // Try inserting user
    await pool.query(
      'INSERT INTO users (email, name, profile_url) VALUES ($1, $2, $3)',
      [email, name, profile_url || null]
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