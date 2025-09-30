import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { savings, goals, actions } from '../../utils/database/schema';
import { eq, sum, count, gte, lte, desc, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    // Authentication
    const authCookie = getAuthCookie(event);
    if (!authCookie) {
      throw createError({ statusCode: 401, statusMessage: 'Not authenticated' });
    }

    const payload = await verifyJWT(authCookie);
    if (!payload) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid token' });
    }

    const userId = payload.userId;

    // Get savings by month (last 12 months)
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - 12);

    const savingsByMonth = await db
      .select({
        month: sql`DATE_FORMAT(occurred_at, '%Y-%m')`.as('month'),
        totalAmount: sum(savings.amountChf),
        count: count(savings.id)
      })
      .from(savings)
      .where(and(
        eq(savings.userId, userId),
        gte(savings.occurredAt, monthsAgo)
      ))
      .groupBy(sql`DATE_FORMAT(occurred_at, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(occurred_at, '%Y-%m')`);

    // Get savings by goal
    const savingsByGoal = await db
      .select({
        goalId: goals.id,
        goalTitle: goals.title,
        goalTarget: goals.targetChf,
        totalSaved: sum(savings.amountChf),
        savingsCount: count(savings.id)
      })
      .from(savings)
      .innerJoin(goals, eq(savings.goalId, goals.id))
      .where(eq(savings.userId, userId))
      .groupBy(goals.id, goals.title, goals.targetChf)
      .orderBy(desc(sum(savings.amountChf)));

    // Get savings by action/category
    const savingsByAction = await db
      .select({
        actionId: actions.id,
        actionTitle: actions.title,
        actionDefault: actions.defaultChf,
        totalSaved: sum(savings.amountChf),
        savingsCount: count(savings.id)
      })
      .from(savings)
      .innerJoin(actions, eq(savings.actionId, actions.id))
      .where(eq(savings.userId, userId))
      .groupBy(actions.id, actions.title, actions.defaultChf)
      .orderBy(desc(count(savings.id)));

    // Get daily savings pattern (average by weekday)
    const savingsByWeekday = await db
      .select({
        weekday: sql`DAYNAME(occurred_at)`.as('weekday'),
        weekdayNum: sql`DAYOFWEEK(occurred_at)`.as('weekdayNum'),
        avgAmount: sql`AVG(amount_chf)`.as('avgAmount'),
        totalAmount: sum(savings.amountChf),
        count: count(savings.id)
      })
      .from(savings)
      .where(eq(savings.userId, userId))
      .groupBy(sql`DAYOFWEEK(occurred_at), DAYNAME(occurred_at)`)
      .orderBy(sql`DAYOFWEEK(occurred_at)`);

    // Get recent activity (last 30 days trend)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await db
      .select({
        date: sql`DATE(occurred_at)`.as('date'),
        totalAmount: sum(savings.amountChf),
        count: count(savings.id)
      })
      .from(savings)
      .where(and(
        eq(savings.userId, userId),
        gte(savings.occurredAt, thirtyDaysAgo)
      ))
      .groupBy(sql`DATE(occurred_at)`)
      .orderBy(sql`DATE(occurred_at)`);

    // Calculate savings statistics
    const totalStats = await db
      .select({
        totalAmount: sum(savings.amountChf),
        totalCount: count(savings.id),
        avgAmount: sql`AVG(amount_chf)`.as('avgAmount'),
        maxAmount: sql`MAX(amount_chf)`.as('maxAmount'),
        minAmount: sql`MIN(amount_chf)`.as('minAmount')
      })
      .from(savings)
      .where(eq(savings.userId, userId));

    return {
      success: true,
      analytics: {
        overview: {
          totalSaved: Number(totalStats[0]?.totalAmount) || 0,
          totalTransactions: Number(totalStats[0]?.totalCount) || 0,
          averageSaving: Number(totalStats[0]?.avgAmount) || 0,
          largestSaving: Number(totalStats[0]?.maxAmount) || 0,
          smallestSaving: Number(totalStats[0]?.minAmount) || 0
        },
        monthlyTrend: savingsByMonth.map(month => ({
          month: month.month,
          amount: Number(month.totalAmount) || 0,
          count: Number(month.count) || 0
        })),
        goalBreakdown: savingsByGoal.map(goal => ({
          goalId: goal.goalId,
          title: goal.goalTitle,
          targetAmount: Number(goal.goalTarget),
          savedAmount: Number(goal.totalSaved) || 0,
          savingsCount: Number(goal.savingsCount) || 0,
          progressPercentage: Number(goal.goalTarget) > 0 
            ? Math.round(((Number(goal.totalSaved) || 0) / Number(goal.goalTarget)) * 100 * 100) / 100
            : 0
        })),
        actionBreakdown: savingsByAction.map(action => ({
          actionId: action.actionId,
          title: action.actionTitle,
          defaultAmount: Number(action.actionDefault),
          totalSaved: Number(action.totalSaved) || 0,
          usageCount: Number(action.savingsCount) || 0
        })),
        weekdayPattern: savingsByWeekday.map(day => ({
          weekday: day.weekday,
          weekdayNum: Number(day.weekdayNum),
          averageAmount: Number(day.avgAmount) || 0,
          totalAmount: Number(day.totalAmount) || 0,
          count: Number(day.count) || 0
        })),
        recentActivity: recentActivity.map(day => ({
          date: day.date,
          amount: Number(day.totalAmount) || 0,
          count: Number(day.count) || 0
        }))
      }
    };

  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch analytics'
    });
  }
});