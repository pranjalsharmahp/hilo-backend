const express= require('express');
const router= express.Router();
const { pool } = require('../db/db');

router.get('/inbox', async (req, res) => { 
    const userEmail = req.query.email;
    if (!userEmail) {
        return res.status(400).json({ error: 'Email query parameter is required' });
    }
    try{
        const result = await pool.query('SELECT *, CASE WHEN user1_email = $1 THEN user2_email ELSE user1_email END AS other_user_email FROM conversations WHERE user1_email = $1 OR user2_email = $1 ORDER BY last_updated DESC', [userEmail]);
        res.status(200).json({
            message: 'Conversations retrieved successfully',
            data: result.rows
        });
    } catch (error) {
        console.error('Error retrieving conversations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/' , async (req, res) => {
    const { user1_email, user2_email,last_message,last_sender_email  } = req.body;

    if (!user1_email || !user2_email || !last_message || !last_sender_email) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const [email1, email2] = [user1_email, user2_email].sort();
    try {
        const result = await pool.query(
            `
            INSERT INTO conversations (user1_email, user2_email, last_message, last_sender_email, last_updated)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (user1_email, user2_email)
            DO UPDATE SET
                last_message = EXCLUDED.last_message,
                last_sender_email = EXCLUDED.last_sender_email,
                last_updated = NOW()
            RETURNING *
            `,
            [email1, email2, last_message, last_sender_email]
        );
        res.status(201).json({
            message: 'Conversation created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;