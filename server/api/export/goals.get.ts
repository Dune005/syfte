import { eq } from 'drizzle-orm';
import { db } from '../../utils/database/connection';
import { goals, savings, actions } from '../../utils/database/schema';
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

    // Get query parameters
    const query = getQuery(event);
    const format = (query.format as string) || 'json';
    
    if (!['json', 'csv'].includes(format)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültiges Format. Erlaubt: json, csv'
      });
    }

    // Get all user goals with their savings
    const userGoals = await db
      .select({
        id: goals.id,
        title: goals.title,
        targetChf: goals.targetChf,
        savedChf: goals.savedChf,
        imageUrl: goals.imageUrl,
        isFavorite: goals.isFavorite,
        isShared: goals.isShared,
        createdAt: goals.createdAt,
        updatedAt: goals.updatedAt
      })
      .from(goals)
      .where(eq(goals.ownerId, payload.userId))
      .orderBy(goals.createdAt);

    // Get savings for each goal
    const goalsWithSavings = await Promise.all(
      userGoals.map(async (goal) => {
        const goalSavings = await db
          .select({
            id: savings.id,
            amountChf: savings.amountChf,
            note: savings.note,
            occurredAt: savings.occurredAt,
            createdAt: savings.createdAt,
            actionTitle: actions.title,
            actionDescription: actions.description
          })
          .from(savings)
          .leftJoin(actions, eq(savings.actionId, actions.id))
          .where(eq(savings.goalId, goal.id))
          .orderBy(savings.occurredAt);

        const progressPercent = Number(goal.targetChf) > 0 
          ? Math.round((Number(goal.savedChf) / Number(goal.targetChf)) * 100) 
          : 0;

        return {
          ...goal,
          targetChf: Number(goal.targetChf),
          savedChf: Number(goal.savedChf),
          progressPercent,
          remainingChf: Math.max(0, Number(goal.targetChf) - Number(goal.savedChf)),
          isCompleted: Number(goal.savedChf) >= Number(goal.targetChf),
          savingsCount: goalSavings.length,
          savings: goalSavings.map(saving => ({
            id: saving.id,
            amountChf: Number(saving.amountChf),
            note: saving.note,
            occurredAt: saving.occurredAt,
            createdAt: saving.createdAt,
            actionTitle: saving.actionTitle,
            actionDescription: saving.actionDescription
          }))
        };
      })
    );

    // Calculate export statistics
    const exportStats = {
      totalGoals: goalsWithSavings.length,
      completedGoals: goalsWithSavings.filter(g => g.isCompleted).length,
      totalTarget: goalsWithSavings.reduce((sum, g) => sum + g.targetChf, 0),
      totalSaved: goalsWithSavings.reduce((sum, g) => sum + g.savedChf, 0),
      totalSavings: goalsWithSavings.reduce((sum, g) => sum + g.savingsCount, 0),
      exportedAt: new Date().toISOString(),
      exportFormat: format
    };

    if (format === 'json') {
      // Return JSON format
      setHeader(event, 'Content-Type', 'application/json');
      setHeader(event, 'Content-Disposition', `attachment; filename="syfte-goals-${new Date().toISOString().split('T')[0]}.json"`);
      
      return {
        success: true,
        exportStats,
        goals: goalsWithSavings
      };
    } else {
      // Return CSV format
      setHeader(event, 'Content-Type', 'text/csv; charset=utf-8');
      setHeader(event, 'Content-Disposition', `attachment; filename="syfte-goals-${new Date().toISOString().split('T')[0]}.csv"`);
      
      // Generate CSV headers
      const csvHeaders = [
        'Goal ID', 'Title', 'Target CHF', 'Saved CHF', 'Progress %', 'Remaining CHF',
        'Is Favorite', 'Is Shared', 'Is Completed', 'Savings Count', 'Created At', 'Updated At'
      ];
      
      // Generate CSV rows
      const csvRows = goalsWithSavings.map(goal => [
        goal.id,
        `"${goal.title}"`,
        goal.targetChf,
        goal.savedChf,
        goal.progressPercent,
        goal.remainingChf,
        goal.isFavorite ? 'Yes' : 'No',
        goal.isShared ? 'Yes' : 'No',
        goal.isCompleted ? 'Yes' : 'No',
        goal.savingsCount,
        new Date(goal.createdAt).toISOString(),
        new Date(goal.updatedAt).toISOString()
      ]);
      
      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      return csvContent;
    }

  } catch (error: any) {
    console.error('Export goals error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Exportieren der Sparziele.'
    });
  }
});