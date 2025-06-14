export class SecurityManager {
  constructor() {
    this.blockedUsers = new Set();
    this.suspiciousActivity = new Map();
    this.spamPatterns = [
      /(.)\1{10,}/,  // Repeated characters
      /https?:\/\/[^\s]+/gi,  // URLs
      /[@#]\w+/g,    // Mentions/hashtags
    ];
  }

  async isBlocked(userId) {
    return this.blockedUsers.has(userId);
  }

  blockUser(userId, reason = 'security violation') {
    this.blockedUsers.add(userId);
    console.log(`🚫 User ${userId} blocked: ${reason}`);
  }

  unblockUser(userId) {
    return this.blockedUsers.delete(userId);
  }

  detectSpam(message) {
    if (!message || typeof message !== 'string') return false;

    // Check for spam patterns
    for (const pattern of this.spamPatterns) {
      if (pattern.test(message)) {
        return true;
      }
    }

    // Check for excessive caps
    const caps = (message.match(/[A-Z]/g) || []).length;
    if (caps > message.length * 0.7 && message.length > 10) {
      return true;
    }

    return false;
  }

  trackSuspiciousActivity(userId, activity) {
    if (!this.suspiciousActivity.has(userId)) {
      this.suspiciousActivity.set(userId, []);
    }

    const activities = this.suspiciousActivity.get(userId);
    activities.push({
      activity,
      timestamp: Date.now()
    });

    // Keep only last 10 activities
    if (activities.length > 10) {
      activities.shift();
    }

    // Check for suspicious patterns
    const recentActivities = activities.filter(
      a => Date.now() - a.timestamp < 60000
    );

    if (recentActivities.length > 5) {
      this.blockUser(userId, 'suspicious activity pattern');
    }
  }

  getBlockedUsers() {
    return Array.from(this.blockedUsers);
  }

  cleanup() {
    // Clean old suspicious activity data
    for (const [userId, activities] of this.suspiciousActivity.entries()) {
      const recent = activities.filter(
        a => Date.now() - a.timestamp < 3600000 // 1 hour
      );

      if (recent.length === 0) {
        this.suspiciousActivity.delete(userId);
      } else {
        this.suspiciousActivity.set(userId, recent);
      }
    }
  }
}