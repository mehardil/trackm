import express from 'express';
import { db } from '../db';
import { activities } from '../schema';
import { eq, gte, lte, desc, and } from 'drizzle-orm';
import { wsManager } from '../websocket';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all activity routes
router.use(authenticateToken);

// POST /api/activity - Record new activity
router.post('/', async (req, res) => {
  try {
    console.log('Received activity data:', JSON.stringify(req.body, null, 2));
    
    let activityData;
    
    // Handle agent format (direct from desktop agents)
    if (req.body.userId || req.body.user_id) {
      const {
        userId,
        user_id,
        teamId,
        team_id,
        timestamp,
        startTime,
        endTime,
        application,
        title,
        isActive,
        is_active,
        idleTime,
        metrics,
        imageData
      } = req.body;

      // Validate required fields
      if (!timestamp && !startTime) {
        console.error('Missing required field: timestamp or startTime');
        throw new Error('Missing required field: timestamp or startTime');
      }
      if (!userId && !user_id) {
        console.error('Missing required field: userId or user_id');
        throw new Error('Missing required field: userId or user_id');
      }

      activityData = {
        user_id: user_id || userId,
        team_id: team_id || teamId || null,
        start_time: new Date(startTime || timestamp),
        end_time: new Date(endTime || timestamp),
        duration: endTime ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000) : 0,
        application: application || 'Unknown',
        title: title || 'Unknown',
        category: 'Uncategorized',
        is_active: is_active !== undefined ? is_active : (isActive !== undefined ? isActive : true)
      };
      
      console.log('Processed activity data:', JSON.stringify(activityData, null, 2));
    } else {
      // Handle standard format
      const {
        user_id,
        team_id,
        start_time,
        end_time,
        duration,
        application,
        website,
        title,
        category,
        is_active
      } = req.body;

      // Validate required fields
      if (!user_id) {
        console.error('Missing required field: user_id');
        throw new Error('Missing required field: user_id');
      }
      if (!start_time) {
        console.error('Missing required field: start_time');
        throw new Error('Missing required field: start_time');
      }
      if (!end_time) {
        console.error('Missing required field: end_time');
        throw new Error('Missing required field: end_time');
      }

      activityData = {
        user_id,
        team_id: team_id || null,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        duration,
        application,
        website,
        title,
        category,
        is_active
      };
      
      console.log('Processed activity data:', JSON.stringify(activityData, null, 2));
    }

    // Insert activity data
    const result = await db.insert(activities).values(activityData).returning();
    console.log('Database insert result:', JSON.stringify(result, null, 2));

    // Broadcast activity to WebSocket clients if team_id is present
    if (activityData.team_id) {
      wsManager.broadcastToTeam(activityData.team_id, result[0]);
    }

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error recording activity:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to record activity',
      message: error.message,
      details: error.stack
    });
  }
});

// GET /api/activity - Get activity history
router.get('/', async (req, res) => {
  try {
    const { user_id, team_id, startDate, endDate } = req.query;
    
    const query = db.select().from(activities);
    
    if (user_id) {
      query.where(eq(activities.user_id, parseInt(user_id as string)));
    }
    
    if (team_id) {
      query.where(eq(activities.team_id, parseInt(team_id as string)));
    }
    
    if (startDate && endDate) {
      query.where(
        and(
          gte(activities.start_time, new Date(startDate as string)),
          lte(activities.end_time, new Date(endDate as string))
        )
      );
    }
    
    query.orderBy(desc(activities.start_time));
    
    const results = await query;
    res.json(results);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

export default router; 