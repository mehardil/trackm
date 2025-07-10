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
        metrics
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

    // Prepare WebSocket message
    const wsMessage = {
      type: 'activity',
      data: {
        id: result[0].id,
        userId: result[0].user_id,
        teamId: result[0].team_id,
        timestamp: result[0].start_time.toISOString(),
        application: result[0].application,
        title: result[0].title,
        isActive: result[0].is_active
      }
    };

    // Broadcast activity to WebSocket clients if team_id is present
    if (activityData.team_id) {
      wsManager.broadcastToTeam(activityData.team_id, JSON.stringify(wsMessage));
    } else {
      // Broadcast to all connected clients if no team specified
      wsManager.broadcast(JSON.stringify(wsMessage));
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
    console.log('Fetching activities with query params:', req.query);
    
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
    console.log('Fetched activities:', results.length);
    res.json(results);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// GET /api/activities/timeline - Get activity timeline data
router.get('/timeline', async (req, res) => {
  try {
    const { timeRange } = req.query;
    console.log('Fetching timeline data for range:', timeRange);

    let startDate = new Date();
    switch (timeRange) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Default to week
    }

    console.log('Querying activities from:', startDate.toISOString());

    const query = db.select()
      .from(activities)
      .where(gte(activities.start_time, startDate))
      .orderBy(desc(activities.start_time));

    const results = await query;
    console.log('Fetched timeline activities:', results.length);
    console.log('Sample activities:', JSON.stringify(results.slice(0, 3), null, 2));

    // Process data into timeline format
    const timelineData = processTimelineData(results, timeRange as string);
    console.log('Processed timeline data:', JSON.stringify(timelineData, null, 2));
    
    res.json(timelineData);
  } catch (error) {
    console.error('Error fetching timeline data:', error);
    res.status(500).json({ error: 'Failed to fetch timeline data' });
  }
});

// Helper function to process timeline data
function processTimelineData(activities: any[], timeRange: string) {
  const timelineData: any[] = [];
  const now = new Date();

  if (timeRange === 'day') {
    // Group by hour
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now);
      hour.setHours(i, 0, 0, 0);
      
      const hourActivities = activities.filter(activity => {
        const activityHour = new Date(activity.start_time).getHours();
        return activityHour === i;
      });

      timelineData.push({
        time: `${i.toString().padStart(2, '0')}:00`,
        productive: hourActivities.filter(a => a.category === 'productive').length,
        neutral: hourActivities.filter(a => a.category === 'neutral').length,
        unproductive: hourActivities.filter(a => a.category === 'unproductive').length
      });
    }
  } else if (timeRange === 'week') {
    // Group by day
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      
      const dayActivities = activities.filter(activity => {
        const activityDay = new Date(activity.start_time).getDay();
        return activityDay === day.getDay();
      });

      timelineData.push({
        time: days[day.getDay()],
        productive: dayActivities.filter(a => a.category === 'productive').length,
        neutral: dayActivities.filter(a => a.category === 'neutral').length,
        unproductive: dayActivities.filter(a => a.category === 'unproductive').length
      });
    }
  } else if (timeRange === 'month') {
    // Group by week
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      
      const weekActivities = activities.filter(activity => {
        const activityDate = new Date(activity.start_time);
        return activityDate >= weekStart && activityDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      });

      timelineData.push({
        time: `Week ${4 - i}`,
        productive: weekActivities.filter(a => a.category === 'productive').length,
        neutral: weekActivities.filter(a => a.category === 'neutral').length,
        unproductive: weekActivities.filter(a => a.category === 'unproductive').length
      });
    }
  }

  return timelineData;
}

export default router; 