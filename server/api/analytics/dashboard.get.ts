import { eq, gte, and, sql } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { savings, goals, users, streaks } from '../../utils/database/schema';
import { verifyJWT, getAuthCookie } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  try {
    // Only allow GET requests
    assertMethod(event, 'GET');
    
    // Get auth token
    const token = getAuthCookie(event);
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Nicht authentifiziert.'
      });
    }

    // Verify JWT token
    const payload = verifyJWT(token);
    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Ungültiges Token.'
      });
    }

    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get user's basic stats
    const userStats = await db
      .select({
        totalSavedChf: users.totalSavedChf,
        firstName: users.firstName
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    // Get savings this month
    const monthlyStats = await db
      .select({
        totalAmount: sql`SUM(amount_chf)`.as('totalAmount'),
        savingsCount: sql`COUNT(*)`.as('savingsCount')
      })
      .from(savings)
      .where(and(
        eq(savings.userId, payload.userId),
        gte(savings.occurredAt, thisMonth)
      ));

    // Get savings this year
    const yearlyStats = await db
      .select({
        totalAmount: sql`SUM(amount_chf)`.as('totalAmount'),
        savingsCount: sql`COUNT(*)`.as('savingsCount')
      })
      .from(savings)
      .where(and(
        eq(savings.userId, payload.userId),
        gte(savings.occurredAt, thisYear)
      ));

    // Get last 30 days trend
    const dailyTrend = await db
      .select({
        date: sql`DATE(occurred_at)`.as('date'),
        amount: sql`SUM(amount_chf)`.as('amount'),
        count: sql`COUNT(*)`.as('count')
      })
      .from(savings)
      .where(and(
        eq(savings.userId, payload.userId),
        gte(savings.occurredAt, last30Days)
      ))
      .groupBy(sql`DATE(occurred_at)`)
      .orderBy(sql`DATE(occurred_at)`);

    // Get goals progress
    const goalsProgress = await db
      .select({
        id: goals.id,
        title: goals.title,
        targetChf: goals.targetChf,
        savedChf: goals.savedChf,
        progressPercent: sql`ROUND((saved_chf / target_chf) * 100, 2)`.as('progressPercent'),
        isCompleted: sql`saved_chf >= target_chf`.as('isCompleted')
      })
      .from(goals)
      .where(eq(goals.ownerId, payload.userId))
      .orderBy(sql`(saved_chf / target_chf) DESC`);

    // Get current streak (nur noch 1 Eintrag pro User)
    const [currentStreak] = await db
      .select({
        goalId: streaks.goalId,
        currentCount: streaks.currentCount,
        longestCount: streaks.longestCount,
        goalTitle: goals.title
      })
      .from(streaks)
      .leftJoin(goals, eq(streaks.goalId, goals.id))
      .where(eq(streaks.userId, payload.userId))
      .limit(1);

    const totalCurrentStreak = currentStreak?.currentCount || 0;
    const totalLongestStreak = currentStreak?.longestCount || 0;

    return {
      success: true,
      dashboard: {
        user: {
          name: userStats[0]?.firstName || 'User',
          totalSaved: Number(userStats[0]?.totalSavedChf) || 0
        },
        thisMonth: {
          amount: Number(monthlyStats[0]?.totalAmount) || 0,
          savingsCount: Number(monthlyStats[0]?.savingsCount) || 0
        },
        thisYear: {
          amount: Number(yearlyStats[0]?.totalAmount) || 0,
          savingsCount: Number(yearlyStats[0]?.savingsCount) || 0
        },
        streaks: {
          current: totalCurrentStreak,
          longest: totalLongestStreak
        },
        goals: {
          total: goalsProgress.length,
          completed: goalsProgress.filter(g => g.isCompleted).length,
          averageProgress: goalsProgress.length > 0 
            ? Math.round(goalsProgress.reduce((sum, g) => sum + Number(g.progressPercent), 0) / goalsProgress.length)
            : 0
        },
        trends: {
          last30Days: dailyTrend.map(day => ({
            date: day.date,
            amount: Number(day.amount),
            count: Number(day.count)
          }))
        },
        topGoals: goalsProgress.slice(0, 3).map(goal => ({
          id: goal.id,
          title: goal.title,
          progress: Number(goal.progressPercent),
          saved: Number(goal.savedChf),
          target: Number(goal.targetChf)
        }))
      }
    };

  } catch (error: any) {
    console.error('Get analytics dashboard error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Laden der Analytics-Daten.'
    });
  }
});