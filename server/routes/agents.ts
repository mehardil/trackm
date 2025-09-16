import express from 'express';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';

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
        `INSERT INTO agent_configs (user_id, agent_id, machine_info, created_at, updated_at) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
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
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const userId = req.user.id;

        const agentQuery = await pool.query(
            'SELECT * FROM agent_configs WHERE user_id = $1',
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

// Get all agents with their status and configuration
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get all agents (users with is_agent = true) and their configurations
        const agentsQuery = await pool.query(`
            SELECT 
                u.id, u.name, u.email, u.status, u.last_active, u.organization_id,
                ac.agent_id, ac.machine_info, ac.created_at as agent_created_at,
                acs.version, acs.platform, acs.is_running, acs.is_connected,
                acs.last_activity_time, acs.cpu_usage, acs.memory_usage, acs.disk_space
            FROM users u
            LEFT JOIN agent_configs ac ON u.id = ac.user_id
            LEFT JOIN agent_status acs ON u.id = acs.user_id
            WHERE u.is_agent = true
            ORDER BY u.last_active DESC
        `);

        // Process the results to group by agent
        const agents = agentsQuery.rows.map(row => ({
            id: row.id,
            name: row.name,
            email: row.email,
            status: row.status,
            lastActive: row.last_active,
            organizationId: row.organization_id,
            agentId: row.agent_id,
            machineInfo: row.machine_info,
            createdAt: row.agent_created_at,
            currentStatus: {
                version: row.version,
                platform: row.platform,
                isRunning: row.is_running,
                isConnected: row.is_connected,
                lastActivityTime: row.last_activity_time,
                cpuUsage: row.cpu_usage,
                memoryUsage: row.memory_usage,
                diskSpace: row.disk_space
            }
        }));

        res.json(agents);
    } catch (error) {
        console.error('Error getting agents:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 