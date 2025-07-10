import express from 'express';
import { db } from '../db';
import { activities, agents } from '../schema';
import { eq, gte, lte, desc, and, sql, count, sum } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all dashboard routes
router.use(authenticateToken);

// GET /api/dashboard/metrics - Get dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    const { time_range, team_id, user_id } = req.query;
    console.log('Fetching dashboard metrics:', { time_range, team_id, user_id });

    // Calculate date range
    let startDate = new Date();
    switch (time_range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0); // Default to today
    }

    // Build query conditions
    const conditions = [gte(activities.start_time, startDate)];
    
    if (team_id && team_id !== 'all') {
      conditions.push(eq(activities.team_id, parseInt(team_id as string)));
    }
    
    if (user_id && user_id !== 'all') {
      conditions.push(eq(activities.user_id, parseInt(user_id as string)));
    }

    // Get total active time
    const totalTimeResult = await db
      .select({ total: sum(activities.duration) })
      .from(activities)
      .where(and(...conditions));

    const totalActiveTime = totalTimeResult[0]?.total || 0;

    // Get productive time (you can customize this logic)
    const productiveTimeResult = await db
      .select({ total: sum(activities.duration) })
      .from(activities)
      .where(and(...conditions, eq(activities.category, 'productive')));

    const productiveTime = productiveTimeResult[0]?.total || 0;

    // Get neutral time
    const neutralTimeResult = await db
      .select({ total: sum(activities.duration) })
      .from(activities)
      .where(and(...conditions, eq(activities.category, 'neutral')));

    const neutralTime = neutralTimeResult[0]?.total || 0;

    // Get unproductive time
    const unproductiveTimeResult = await db
      .select({ total: sum(activities.duration) })
      .from(activities)
      .where(and(...conditions, eq(activities.category, 'unproductive')));

    const unproductiveTime = unproductiveTimeResult[0]?.total || 0;

    // Get unique applications count
    const applicationsResult = await db
      .select({ count: count() })
      .from(activities)
      .where(and(...conditions))
      .groupBy(activities.application);

    const applicationsUsed = applicationsResult.length;

    // Get unique users count
    const usersResult = await db
      .select({ count: count() })
      .from(activities)
      .where(and(...conditions))
      .groupBy(activities.user_id);

    const totalUsers = usersResult.length;

    // Calculate productivity score
    const productivityScore = totalActiveTime > 0 
      ? Math.round((productiveTime / totalActiveTime) * 100) 
      : 0;

    // Get active users (users with activity in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsersResult = await db
      .select({ count: count() })
      .from(activities)
      .where(and(...conditions, gte(activities.start_time, fiveMinutesAgo)))
      .groupBy(activities.user_id);

    const activeUsers = activeUsersResult.length;

    const metrics = {
      total_active_time: totalActiveTime,
      productive_time: productiveTime,
      neutral_time: neutralTime,
      unproductive_time: unproductiveTime,
      active_users: activeUsers,
      total_users: totalUsers,
      productivity_score: productivityScore,
      applications_used: applicationsUsed,
      websites_visited: 0 // You can add website tracking later
    };

    console.log('Dashboard metrics:', metrics);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// GET /api/activities/recent - Get recent activities
router.get('/recent', async (req, res) => {
  try {
    const { time_range, limit = '10' } = req.query;
    console.log('Fetching recent activities:', { time_range, limit });

    // Calculate date range
    let startDate = new Date();
    switch (time_range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 1); // Default to last 24 hours
    }

    const recentActivities = await db
      .select({
        id: activities.id,
        user_id: activities.user_id,
        application: activities.application,
        title: activities.title,
        duration: activities.duration,
        start_time: activities.start_time,
        category: activities.category
      })
      .from(activities)
      .where(gte(activities.start_time, startDate))
      .orderBy(desc(activities.start_time))
      .limit(parseInt(limit as string));

    // Add user names (in a real app, you'd join with users table)
    const activitiesWithUserNames = recentActivities.map(activity => ({
      ...activity,
      user_name: `User-${activity.user_id}`,
      timestamp: activity.start_time.toISOString()
    }));

    console.log('Recent activities:', activitiesWithUserNames.length);
    res.json(activitiesWithUserNames);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

// GET /api/applications/top - Get top applications
router.get('/top', async (req, res) => {
  try {
    const { time_range, limit = '5' } = req.query;
    console.log('Fetching top applications:', { time_range, limit });

    // Calculate date range
    let startDate = new Date();
    switch (time_range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 1); // Default to last 24 hours
    }

    const topApplications = await db
      .select({
        name: activities.application,
        usage_time: sum(activities.duration),
        category: activities.category,
        sessions: count()
      })
      .from(activities)
      .where(and(
        gte(activities.start_time, startDate),
        sql`${activities.application} != 'Unknown'`
      ))
      .groupBy(activities.application, activities.category)
      .orderBy(desc(sum(activities.duration)))
      .limit(parseInt(limit as string));

    console.log('Top applications:', topApplications.length);
    res.json(topApplications);
  } catch (error) {
    console.error('Error fetching top applications:', error);
    res.status(500).json({ error: 'Failed to fetch top applications' });
  }
});

export default router; 