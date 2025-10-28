const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes in this file
router.use(authMiddleware);

/**
 * @route   GET /api/friendships
 * @desc    Get all accepted friends for the logged-in user
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.userId;
        // Find friendships where the user is either user_one or user_two AND status is 'accepted'
        // Join with the users table to get the friend's details
        const friendsResult = await pool.query(
            `SELECT
                f.friendship_id,
                CASE
                    WHEN f.user_one_id = $1 THEN f.user_two_id
                    ELSE f.user_one_id
                END AS friend_user_id,
                u.username AS friend_username,
                u.profile_picture_url AS friend_avatar
             FROM friendships f
             JOIN users u ON u.user_id = CASE
                                        WHEN f.user_one_id = $1 THEN f.user_two_id
                                        ELSE f.user_one_id
                                     END
             WHERE (f.user_one_id = $1 OR f.user_two_id = $1) AND f.status = 'accepted'`,
            [userId]
        );
        res.json(friendsResult.rows);
    } catch (err) {
        console.error('Get Friends Error:', err.message);
        res.status(500).json({ error: 'Server error fetching friends.' });
    }
});

/**
 * @route   GET /api/friendships/pending
 * @desc    Get pending friend requests sent TO the logged-in user
 * @access  Private
 */
router.get('/pending', async (req, res) => {
    try {
        const userId = req.userId;

        // This is the corrected query
        const pendingRequests = await pool.query(
            `SELECT
                f.friendship_id,
                f.action_user_id AS sender_id,
                u.username AS sender_username,
                u.profile_picture_url AS sender_avatar,
                f.created_at
             FROM friendships f
             JOIN users u ON f.action_user_id = u.user_id
             WHERE (f.user_one_id = $1 OR f.user_two_id = $1)
               AND f.status = 'pending'
               AND f.action_user_id != $1`,
            [userId]
        );

        res.json(pendingRequests.rows);
    } catch (err) {
        console.error('Get Pending Requests Error:', err.message);
        res.status(500).json({ error: 'Server error fetching pending requests.' });
    }
});

/**
 * @route   POST /api/friendships/request/:targetUserId
 * @desc    Send a friend request to another user
 * @access  Private
 */
router.post('/request/:targetUserId', async (req, res) => {
    try {
        const senderId = req.userId;
        const targetUserId = parseInt(req.params.targetUserId, 10);

        if (isNaN(targetUserId)) {
             return res.status(400).json({ error: "Invalid target user ID." });
        }

        if (senderId === targetUserId) {
            return res.status(400).json({ error: "You cannot send a friend request to yourself." });
        }

        const targetUserExists = await pool.query('SELECT 1 FROM users WHERE user_id = $1', [targetUserId]);
        if (targetUserExists.rows.length === 0) {
            return res.status(404).json({ error: "Target user not found." });
        }

        const userOneId = Math.min(senderId, targetUserId);
        const userTwoId = Math.max(senderId, targetUserId);

        const existingFriendship = await pool.query(
            'SELECT * FROM friendships WHERE user_one_id = $1 AND user_two_id = $2',
            [userOneId, userTwoId]
        );

        if (existingFriendship.rows.length > 0) {
             const existingStatus = existingFriendship.rows[0].status;
             if (existingStatus === 'accepted') {
                 return res.status(400).json({ error: 'You are already friends with this user.' });
             } else if (existingStatus === 'pending') {
                 const actionUserId = existingFriendship.rows[0].action_user_id;
                 if (actionUserId === senderId) {
                      return res.status(400).json({ error: 'You already sent a friend request to this user.' });
                 } else {
                      return res.status(400).json({ error: 'This user already sent you a friend request. Respond to it.' });
                 }
             } else {
                 return res.status(400).json({ error: 'Cannot send friend request.' });
             }
        }

        await pool.query(
            'INSERT INTO friendships (user_one_id, user_two_id, status, action_user_id) VALUES ($1, $2, $3, $4)',
            [userOneId, userTwoId, 'pending', senderId]
        );

        res.status(201).json({ message: 'Friend request sent.' });
    } catch (err) {
        console.error('Send Friend Request Error:', err.message);
        res.status(500).json({ error: 'Server error sending friend request.' });
    }
});


/**
 * @route   PUT /api/friendships/respond/:friendshipId
 * @desc    Accept or reject a pending friend request
 * @access  Private
 */
router.put('/respond/:friendshipId', async (req, res) => {
    try {
        const recipientId = req.userId;
        const friendshipId = parseInt(req.params.friendshipId, 10);
        const { action } = req.body;

        if (isNaN(friendshipId)) {
             return res.status(400).json({ error: "Invalid friendship ID." });
        }

        if (action !== 'accept' && action !== 'reject') {
            return res.status(400).json({ error: "Invalid action. Use 'accept' or 'reject'." });
        }

        const requestResult = await pool.query(
            `SELECT * FROM friendships
             WHERE friendship_id = $1
               AND (user_one_id = $2 OR user_two_id = $2)
               AND status = 'pending'
               AND action_user_id != $2`,
            [friendshipId, recipientId]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pending friend request not found or you are not the recipient.' });
        }

        if (action === 'accept') {
            await pool.query(
                'UPDATE friendships SET status = $1, action_user_id = $2 WHERE friendship_id = $3',
                ['accepted', recipientId, friendshipId]
            );
            res.json({ message: 'Friend request accepted.' });
        } else { // action === 'reject'
            await pool.query(
                'DELETE FROM friendships WHERE friendship_id = $1',
                [friendshipId]
            );
            res.json({ message: 'Friend request rejected.' });
        }
    } catch (err) {
    console.error('Respond Friend Request Error:', err.message);
    res.status(500).json({ error: 'Server error responding to friend request.' }); // <-- Corrected
  }
});


/**
 * @route   DELETE /api/friendships/:friendshipId
 * @desc    Remove an existing friend (unfriend)
 * @access  Private
 */
router.delete('/:friendshipId', async (req, res) => {
    try {
        const userId = req.userId;
        const friendshipId = parseInt(req.params.friendshipId, 10);

        if (isNaN(friendshipId)) {
             return res.status(400).json({ error: "Invalid friendship ID." });
        }

        const deleteResult = await pool.query(
            `DELETE FROM friendships
             WHERE friendship_id = $1
               AND (user_one_id = $2 OR user_two_id = $2)
               AND status = 'accepted'
             RETURNING friendship_id`,
            [friendshipId, userId]
        );

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ error: 'Friendship not found or you are not part of it.' });
        }

        res.json({ message: 'Friend removed successfully.' });
    } catch (err) {
        console.error('Remove Friend Error:', err.message);
        res.status(500).json({ error: 'Server error removing friend.' });
    }
});


module.exports = router;