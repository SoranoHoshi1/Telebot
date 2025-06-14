
export class LevelingSystem {
  static calculateLevel(totalExp) {
    const baseExp = 100;
    const multiplier = 1.5;
    
    let level = 1;
    let requiredExp = baseExp;
    let currentExp = totalExp;
    
    while (currentExp >= requiredExp) {
      currentExp -= requiredExp;
      level++;
      requiredExp = Math.floor(baseExp * Math.pow(multiplier, level - 1));
    }
    
    return {
      level,
      currentExp,
      requiredExp,
      totalExp,
      progress: currentExp / requiredExp,
      nextLevelExp: requiredExp - currentExp
    };
  }
  
  static getExpForLevel(level) {
    const baseExp = 100;
    const multiplier = 1.5;
    let totalExp = 0;
    
    for (let i = 1; i < level; i++) {
      totalExp += Math.floor(baseExp * Math.pow(multiplier, i - 1));
    }
    
    return totalExp;
  }
  
  static addExp(userId, amount) {
    const user = global.db.getUser(userId);
    const oldLevel = this.calculateLevel(user.totalExp || 0).level;
    
    user.totalExp = (user.totalExp || 0) + amount;
    
    const newLevel = this.calculateLevel(user.totalExp).level;
    
    if (newLevel > oldLevel) {
      const reward = this.getLevelReward(newLevel);
      user.money = (user.money || 0) + reward.money;
      
      return {
        leveledUp: true,
        oldLevel,
        newLevel,
        reward
      };
    }
    
    return { leveledUp: false, newLevel };
  }
  
  static getLevelReward(level) {
    const baseMoney = 500;
    const moneyMultiplier = 1.2;
    
    return {
      money: Math.floor(baseMoney * Math.pow(moneyMultiplier, level - 1)),
      title: this.getLevelTitle(level)
    };
  }
  
  static getLevelTitle(level) {
    if (level >= 100) return '🏆 Legenda';
    if (level >= 75) return '👑 Master';
    if (level >= 50) return '⭐ Expert';
    if (level >= 25) return '🔥 Pro';
    if (level >= 10) return '💪 Advanced';
    if (level >= 5) return '📈 Intermediate';
    return '🌱 Beginner';
  }
  
  static getLeaderboard(limit = 10) {
    const users = global.db.getAllUsers();
    return users
      .map(user => ({
        ...user,
        levelData: this.calculateLevel(user.totalExp || 0)
      }))
      .sort((a, b) => b.totalExp - a.totalExp)
      .slice(0, limit);
  }
}

export class EconomySystem {
  static async getMoney(userId) {
    const user = global.db.getUser(userId);
    return user.money || 0;
  }
  
  static async addMoney(userId, amount) {
    const user = global.db.getUser(userId);
    user.money = (user.money || 0) + amount;
    
    if (user.money < 0) user.money = 0;
    
    return user.money;
  }
  
  static async removeMoney(userId, amount) {
    const user = global.db.getUser(userId);
    const currentMoney = user.money || 0;
    
    if (currentMoney < amount) {
      return { success: false, message: 'Saldo tidak mencukupi' };
    }
    
    user.money = currentMoney - amount;
    return { success: true, newBalance: user.money };
  }
  
  static async transfer(fromUserId, toUserId, amount) {
    if (fromUserId === toUserId) {
      return { success: false, message: 'Tidak bisa transfer ke diri sendiri' };
    }
    
    const fromUser = global.db.getUser(fromUserId);
    const toUser = global.db.getUser(toUserId);
    
    if ((fromUser.money || 0) < amount) {
      return { success: false, message: 'Saldo tidak mencukupi' };
    }
    
    if (amount < 100) {
      return { success: false, message: 'Minimum transfer 100 coins' };
    }
    
    const fee = Math.floor(amount * 0.05); // 5% fee
    const finalAmount = amount - fee;
    
    fromUser.money = (fromUser.money || 0) - amount;
    toUser.money = (toUser.money || 0) + finalAmount;
    
    return {
      success: true,
      amount: finalAmount,
      fee,
      fromBalance: fromUser.money,
      toBalance: toUser.money
    };
  }
  
  static async daily(userId) {
    const user = global.db.getUser(userId);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (user.lastDaily && (now - user.lastDaily) < oneDay) {
      const remaining = oneDay - (now - user.lastDaily);
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      
      return {
        success: false,
        message: `Daily reward sudah diambil! Tunggu ${hours}h ${minutes}m lagi.`
      };
    }
    
    const isConsecutive = user.lastDaily && (now - user.lastDaily) < (oneDay * 2);
    
    if (isConsecutive) {
      user.dailyStreak = (user.dailyStreak || 0) + 1;
    } else {
      user.dailyStreak = 1;
    }
    
    const baseReward = 1000;
    const streakBonus = Math.min(user.dailyStreak * 100, 2000);
    const levelBonus = LevelingSystem.calculateLevel(user.totalExp || 0).level * 50;
    
    const totalReward = baseReward + streakBonus + levelBonus;
    
    user.money = (user.money || 0) + totalReward;
    user.lastDaily = now;
    
    // Add EXP untuk daily
    const expResult = LevelingSystem.addExp(userId, 50);
    
    return {
      success: true,
      reward: totalReward,
      streak: user.dailyStreak,
      newBalance: user.money,
      expResult
    };
  }
  
  static async work(userId) {
    const user = global.db.getUser(userId);
    const now = Date.now();
    const cooldown = 4 * 60 * 60 * 1000; // 4 jam
    
    if (user.lastWork && (now - user.lastWork) < cooldown) {
      const remaining = cooldown - (now - user.lastWork);
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      
      return {
        success: false,
        message: `Kamu sudah bekerja! Tunggu ${hours}h ${minutes}m lagi.`
      };
    }
    
    const jobs = [
      { name: 'Programmer', min: 800, max: 1500, exp: 30 },
      { name: 'Designer', min: 600, max: 1200, exp: 25 },
      { name: 'Writer', min: 400, max: 900, exp: 20 },
      { name: 'Delivery', min: 300, max: 700, exp: 15 },
      { name: 'Cleaner', min: 200, max: 500, exp: 10 }
    ];
    
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earnings = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
    
    user.money = (user.money || 0) + earnings;
    user.lastWork = now;
    
    const expResult = LevelingSystem.addExp(userId, job.exp);
    
    return {
      success: true,
      job: job.name,
      earnings,
      newBalance: user.money,
      expResult
    };
  }
  
  static async gamble(userId, amount) {
    const user = global.db.getUser(userId);
    
    if ((user.money || 0) < amount) {
      return { success: false, message: 'Saldo tidak mencukupi' };
    }
    
    if (amount < 100) {
      return { success: false, message: 'Minimum bet 100 coins' };
    }
    
    if (amount > 10000) {
      return { success: false, message: 'Maximum bet 10,000 coins' };
    }
    
    const random = Math.random();
    let multiplier = 0;
    let result = '';
    
    if (random < 0.4) { // 40% chance lose
      multiplier = 0;
      result = 'Kalah';
    } else if (random < 0.7) { // 30% chance small win
      multiplier = 1.5;
      result = 'Menang Kecil';
    } else if (random < 0.9) { // 20% chance big win
      multiplier = 2;
      result = 'Menang Besar';
    } else { // 10% chance jackpot
      multiplier = 5;
      result = 'JACKPOT!';
    }
    
    const winnings = Math.floor(amount * multiplier);
    const profit = winnings - amount;
    
    user.money = (user.money || 0) - amount + winnings;
    
    return {
      success: true,
      result,
      multiplier,
      bet: amount,
      winnings,
      profit,
      newBalance: user.money
    };
  }
  
  static getLeaderboard(limit = 10) {
    const users = global.db.getAllUsers();
    return users
      .sort((a, b) => (b.money || 0) - (a.money || 0))
      .slice(0, limit);
  }
  
  static formatMoney(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
  }
}

export default { LevelingSystem, EconomySystem };
