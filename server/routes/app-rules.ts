import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../db';
import { appRules } from '../schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Get all app rules
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rules = await db.select().from(appRules).orderBy(appRules.application);
    res.json({ rules });
  } catch (error) {
    console.error('Error fetching app rules:', error);
    res.status(500).json({ error: 'Failed to fetch app rules' });
  }
});

// Add new app rule
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { application, category, is_blocked } = req.body;
    
    if (!application || !category) {
      return res.status(400).json({ error: 'Application and category are required' });
    }
    
    const [rule] = await db.insert(appRules)
      .values({
        application,
        category,
        is_blocked: is_blocked || false
      })
      .returning();
    
    res.status(201).json({ rule });
  } catch (error) {
    console.error('Error adding app rule:', error);
    res.status(500).json({ error: 'Failed to add app rule' });
  }
});

// Update app rule
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, is_blocked } = req.body;
    
    const [rule] = await db.update(appRules)
      .set({
        category: category || undefined,
        is_blocked: is_blocked !== undefined ? is_blocked : undefined
      })
      .where(eq(appRules.id, parseInt(id)))
      .returning();
    
    if (!rule) {
      return res.status(404).json({ error: 'App rule not found' });
    }
    
    res.json({ rule });
  } catch (error) {
    console.error('Error updating app rule:', error);
    res.status(500).json({ error: 'Failed to update app rule' });
  }
});

// Delete app rule
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rule] = await db.delete(appRules)
      .where(eq(appRules.id, parseInt(id)))
      .returning();
    
    if (!rule) {
      return res.status(404).json({ error: 'App rule not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting app rule:', error);
    res.status(500).json({ error: 'Failed to delete app rule' });
  }
});

export default router; 