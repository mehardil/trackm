import express from 'express';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Register a new agent
router.post('/register', async (req, res) => {
  try {
    const { agentId, organizationId, machineInfo, name, email } = req.body;

    if (!agentId || !organizationId || !machineInfo || !name || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate a unique username for the agent
    const username = `agent-${agentId}-${uuidv4()}`;
    const password = uuidv4(); // Generate a random password

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create a new user for the agent
      const userResult = await client.query(
        `INSERT INTO users (
          username, password, name, email, role, avatar_color, status, 
          last_active, organization_id, is_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          username,
          password,
          name,
          email,
          'agent',
          '#4CAF50', // Default green color for agents
          'active',
          new Date(),
          organizationId,
          true // Mark as agent
        ]
      );

      const userId = userResult.rows[0].id;

      // Save agent configuration
      await client.query(
        `INSERT INTO agent_configs (user_id, agent_id, machine_info) 
         VALUES ($1, $2, $3)`,
        [userId, agentId, JSON.stringify(machineInfo)]
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId, username, role: 'agent' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        token,
        userId,
        username
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error registering agent:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get agent status
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const agentQuery = await pool.query(
            'SELECT * FROM agents WHERE user_id = $1',
            [userId]
        );

        if (agentQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        res.json(agentQuery.rows[0]);
    } catch (error) {
        console.error('Error getting agent status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 