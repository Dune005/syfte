import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { friendships, users, savings } from '../../utils/database/schema';
import { eq, and, or, sum, count, desc, gte } from 'drizzle-orm';

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
    const query = getQuery(event);
    const timeframe = (query.timeframe as string) || 'all_time'; // all_time, month, week

    // Calculate date ranges
    const now = new Date();
    let dateFilter = null;
    
    if (timeframe === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = gte(savings.occurredAt, monthStart);
    } else if (timeframe === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);
      dateFilter = gte(savings.occurredAt, weekStart);
    }

    // Get friend IDs
    const friendships_data = await db
      .select({
        friendId: users.id
      })
      .from(friendships)
      .innerJoin(users, or(
        and(eq(friendships.requesterId, userId), eq(users.id, friendships.addresseeId)),
        and(eq(friendships.addresseeId, userId), eq(users.id, friendships.requesterId))
      ))
      .where(and(
        or(
          eq(friendships.requesterId, userId),
          eq(friendships.addresseeId, userId)
        ),
        eq(friendships.status, 'accepted')
      ));

    const friendIds = friendships_data.map(f => f.friendId);
    
    // Include current user in leaderboard
    const allUserIds = [...friendIds, userId];

    if (allUserIds.length === 0) {
      return {
        success: true,
        leaderboard: [],
        currentUserRank: null,
        timeframe
      };
    }

    // Build leaderboard query
    let leaderboardQuery = db
      .select({
        userId: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        totalSaved: sum(savings.amountChf),
        savingsCount: count(savings.id)
      })
      .from(users)
      .leftJoin(savings, eq(savings.userId, users.id))
      .where(or(...allUserIds.map(id => eq(users.id, id))))
      .groupBy(users.id);

    // Apply date filter if specified
    if (dateFilter) {
      leaderboardQuery = db
        .select({
          userId: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          totalSaved: sum(savings.amountChf),
          savingsCount: count(savings.id)
        })
        .from(users)
        .leftJoin(savings, and(eq(savings.userId, users.id), dateFilter))
        .where(or(...allUserIds.map(id => eq(users.id, id))))
        .groupBy(users.id);
    }

    const leaderboardData = await leaderboardQuery;

    // Sort by total saved (descending) and add ranks
    const sortedLeaderboard = leaderboardData
      .map(user => ({
        userId: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        totalSaved: Number(user.totalSaved) || 0,
        savingsCount: Number(user.savingsCount) || 0,
        isCurrentUser: user.userId === userId
      }))
      .sort((a, b) => b.totalSaved - a.totalSaved)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    // Find current user's rank
    const currentUserRank = sortedLeaderboard.find(user => user.isCurrentUser)?.rank || null;

    return {
      success: true,
      leaderboard: sortedLeaderboard,
      currentUserRank,
      timeframe,
      totalParticipants: sortedLeaderboard.length
    };

  } catch (error: any) {
    console.error('Error fetching friends leaderboard:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch friends leaderboard'
    });
  }
});