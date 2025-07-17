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

module.exports = router;