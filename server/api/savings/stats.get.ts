import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { savings } from '../../utils/database/schema';
import { eq, sum, count, gte, and } from 'drizzle-orm';
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

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's savings
    const todayStats = await db
      .select({
        totalAmount: sum(savings.amountChf),
        count: count(savings.id)
      })
      .from(savings)
      .where(and(
        eq(savings.userId, userId),
        gte(savings.occurredAt, today)
      ));

    // This week's savings
    const weekStats = await db
      .select({
        totalAmount: sum(savings.amountChf),
        count: count(savings.id)
      })
      .from(savings)
      .where(and(
        eq(savings.userId, userId),
        gte(savings.occurredAt, thisWeekStart)
      ));

    // This month's savings
    const monthStats = await db
      .select({
        totalAmount: sum(savings.amountChf),
        count: count(savings.id)
      })
      .from(savings)
      .where(and(
        eq(savings.userId, userId),
        gte(savings.occurredAt, thisMonthStart)
      ));

    // All time stats
    const allTimeStats = await db
      .select({
        totalAmount: sum(savings.amountChf),
        count: count(savings.id)
      })
      .from(savings)
      .where(eq(savings.userId, userId));

    // Daily average (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const last30DaysStats = await db
      .select({
        totalAmount: sum(savings.amountChf),
        count: count(savings.id)
      })
      .from(savings)
      .where(and(
        eq(savings.userId, userId),
        gte(savings.occurredAt, thirtyDaysAgo)
      ));

    const dailyAverage = {
      amount: (Number(last30DaysStats[0]?.totalAmount) || 0) / 30,
      count: (Number(last30DaysStats[0]?.count) || 0) / 30
    };

    return {
      success: true,
      stats: {
        today: {
          amount: Number(todayStats[0]?.totalAmount) || 0,
          count: Number(todayStats[0]?.count) || 0
        },
        thisWeek: {
          amount: Number(weekStats[0]?.totalAmount) || 0,
          count: Number(weekStats[0]?.count) || 0
        },
        thisMonth: {
          amount: Number(monthStats[0]?.totalAmount) || 0,
          count: Number(monthStats[0]?.count) || 0
        },
        allTime: {
          amount: Number(allTimeStats[0]?.totalAmount) || 0,
          count: Number(allTimeStats[0]?.count) || 0
        },
        dailyAverage: {
          amount: Math.round(dailyAverage.amount * 100) / 100,
          count: Math.round(dailyAverage.count * 100) / 100
        }
      }
    };

  } catch (error: any) {
    console.error('Error fetching savings stats:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch savings stats'
    });
  }
});