interface AppRule {
  application: string;
  category: string;
  is_blocked: boolean;
}

export class ActivityMonitor {
  private appRules: AppRule[] = [];
  private lastFetchTime: number = 0;
  private readonly RULES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async fetchAppRules() {
    try {
      const now = Date.now();
      if (now - this.lastFetchTime < this.RULES_CACHE_DURATION) {
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/app-rules', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch app rules');
      }

      const data = await response.json();
      this.appRules = data.rules;
      this.lastFetchTime = now;
    } catch (error) {
      console.error('Error fetching app rules:', error);
    }
  }

  private getActivityCategory(application: string, title: string): string {
    // Check if there's a rule for this application
    const rule = this.appRules.find(r => r.application.toLowerCase() === application.toLowerCase());
    if (rule) {
      if (rule.is_blocked) {
        return 'blocked';
      }
      return rule.category;
    }

    // Default categorization logic
    const lowerTitle = title.toLowerCase();
    const lowerApp = application.toLowerCase();

    // Productive applications
    if (
      lowerApp.includes('code') ||
      lowerApp.includes('visual studio') ||
      lowerApp.includes('intellij') ||
      lowerApp.includes('pycharm') ||
      lowerApp.includes('webstorm') ||
      lowerApp.includes('sublime') ||
      lowerApp.includes('atom') ||
      lowerApp.includes('notepad++') ||
      lowerTitle.includes('code') ||
      lowerTitle.includes('programming') ||
      lowerTitle.includes('development') ||
      lowerTitle.includes('debug') ||
      lowerTitle.includes('terminal') ||
      lowerTitle.includes('command') ||
      lowerTitle.includes('git')
    ) {
      return 'productive';
    }

    // Unproductive applications
    if (
      lowerApp.includes('game') ||
      lowerApp.includes('steam') ||
      lowerApp.includes('epic') ||
      lowerApp.includes('origin') ||
      lowerApp.includes('battle.net') ||
      lowerApp.includes('discord') ||
      lowerApp.includes('whatsapp') ||
      lowerApp.includes('telegram') ||
      lowerApp.includes('messenger') ||
      lowerApp.includes('facebook') ||
      lowerApp.includes('instagram') ||
      lowerApp.includes('twitter') ||
      lowerApp.includes('tiktok') ||
      lowerApp.includes('youtube') ||
      lowerApp.includes('netflix') ||
      lowerApp.includes('spotify') ||
      lowerApp.includes('music') ||
      lowerApp.includes('movie') ||
      lowerApp.includes('video') ||
      lowerApp.includes('game')
    ) {
      return 'unproductive';
    }

    return 'neutral';
  }

  private async handleActivity(activity: Activity) {
    await this.fetchAppRules();
    
    const category = this.getActivityCategory(activity.application, activity.title);
    
    if (category === 'blocked') {
      // Handle blocked application
      console.log(`Blocked application: ${activity.application}`);
      // You can add additional logic here, like showing a notification or closing the application
      return;
    }

    // Send activity to server
    try {
      const response = await fetch('http://127.0.0.1:8000/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...activity,
          category
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send activity');
      }
    } catch (error) {
      console.error('Error sending activity:', error);
    }
  }
} 