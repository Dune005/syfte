import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { savings, goals, actions } from '../../utils/database/schema';
import { eq, desc } from 'drizzle-orm';

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
    const format = (query.format as string) || 'json';

    // Fetch all user savings with related data
    const userSavings = await db
      .select({
        id: savings.id,
        amountChf: savings.amountChf,
        note: savings.note,
        occurredAt: savings.occurredAt,
        createdAt: savings.createdAt,
        goalTitle: goals.title,
        actionTitle: actions.title
      })
      .from(savings)
      .leftJoin(goals, eq(savings.goalId, goals.id))
      .leftJoin(actions, eq(savings.actionId, actions.id))
      .where(eq(savings.userId, userId))
      .orderBy(desc(savings.occurredAt));

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = 'ID,Amount (CHF),Goal,Action,Note,Occurred At,Created At\n';
      const csvRows = userSavings.map(saving => {
        const escapeCsv = (str: string | null) => {
          if (!str) return '';
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        return [
          saving.id,
          saving.amountChf,
          escapeCsv(saving.goalTitle || ''),
          escapeCsv(saving.actionTitle || ''),
          escapeCsv(saving.note || ''),
          saving.occurredAt?.toISOString() || '',
          saving.createdAt?.toISOString() || ''
        ].join(',');
      }).join('\n');

      const csvContent = csvHeaders + csvRows;

      // Set CSV headers
      setHeader(event, 'Content-Type', 'text/csv');
      setHeader(event, 'Content-Disposition', `attachment; filename="syfte-savings-${new Date().toISOString().split('T')[0]}.csv"`);
      
      return csvContent;
    }

    // Return JSON format
    return {
      success: true,
      format: 'json',
      exportedAt: new Date().toISOString(),
      totalRecords: userSavings.length,
      data: userSavings.map(saving => ({
        id: saving.id,
        amountChf: Number(saving.amountChf),
        goal: saving.goalTitle,
        action: saving.actionTitle,
        note: saving.note,
        occurredAt: saving.occurredAt?.toISOString(),
        createdAt: saving.createdAt?.toISOString()
      }))
    };

  } catch (error: any) {
    console.error('Error exporting savings:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to export savings'
    });
  }
});