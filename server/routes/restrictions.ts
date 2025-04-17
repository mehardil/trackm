import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../db';

const router = express.Router();

// Check if an activity is restricted
router.post('/check', authenticateToken, async (req, res) => {
    try {
        const { type, pattern } = req.body;
        
        if (!type || !pattern) {
            return res.status(400).json({ error: 'Type and pattern are required' });
        }

        // Query the database for matching restrictions
        const result = await pool.query(
            `SELECT * FROM restrictions 
             WHERE type = $1 AND $2 LIKE pattern`,
            [type, pattern]
        );

        if (result.rows.length > 0) {
            const restriction = result.rows[0];
            return res.json({
                is_restricted: true,
                restriction: {
                    id: restriction.id,
                    name: restriction.name,
                    type: restriction.type,
                    pattern: restriction.pattern,
                    action: restriction.action,
                    description: restriction.description
                }
            });
        }

        return res.json({ is_restricted: false });
    } catch (error) {
        console.error('Error checking restrictions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all restrictions
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM restrictions ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching restrictions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new restriction
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, type, pattern, action, description } = req.body;
        
        if (!name || !type || !pattern || !action) {
            return res.status(400).json({ error: 'Name, type, pattern, and action are required' });
        }

        const result = await pool.query(
            `INSERT INTO restrictions (name, type, pattern, action, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, type, pattern, action, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating restriction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a restriction
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, pattern, action, description } = req.body;
        
        const result = await pool.query(
            `UPDATE restrictions 
             SET name = $1, type = $2, pattern = $3, action = $4, description = $5
             WHERE id = $6
             RETURNING *`,
            [name, type, pattern, action, description, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Restriction not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating restriction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a restriction
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM restrictions WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Restriction not found' });
        }

        res.json({ message: 'Restriction deleted successfully' });
    } catch (error) {
        console.error('Error deleting restriction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 