import { verifyJWT, getAuthCookie } from '../../utils/auth';
import { db } from '../../utils/database/connection';
import { savings, goals, actions, users } from '../../utils/database/schema';
import { eq, desc, sql } from 'drizzle-orm';
import PDFDocument from 'pdfkit';

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

    // Fetch user info for PDF header
    const user = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userName = user.length > 0 ? `${user[0].firstName} ${user[0].lastName}` : 'User';

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

    if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      
      const pdfBuffer = await new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Header
        doc.fontSize(24).fillColor('#35C2C1').text('Syfte - Sparhistorie', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#666').text(`Exportiert am ${new Date().toLocaleDateString('de-CH')}`, { align: 'center' });
        doc.fontSize(10).text(`Benutzer: ${userName}`, { align: 'center' });
        doc.moveDown(2);

        // Summary
        const totalAmount = userSavings.reduce((sum, s) => sum + Number(s.amountChf), 0);
        doc.fontSize(14).fillColor('#1E232C').text('Zusammenfassung', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#666');
        doc.text(`Gesamtanzahl Sparaktionen: ${userSavings.length}`);
        doc.text(`Gesamtbetrag: CHF ${totalAmount.toFixed(2)}`);
        doc.moveDown(2);

        // Transactions table
        doc.fontSize(14).fillColor('#1E232C').text('Transaktionen', { underline: true });
        doc.moveDown(1);

        // Table header
        const startY = doc.y;
        const tableTop = startY;
        const colWidths = {
          date: 80,
          amount: 70,
          goal: 120,
          action: 120,
          note: 140
        };

        doc.fontSize(9).fillColor('#35C2C1').font('Helvetica-Bold');
        doc.text('Datum', 50, tableTop, { width: colWidths.date });
        doc.text('Betrag', 50 + colWidths.date, tableTop, { width: colWidths.amount });
        doc.text('Sparziel', 50 + colWidths.date + colWidths.amount, tableTop, { width: colWidths.goal });
        doc.text('Aktion', 50 + colWidths.date + colWidths.amount + colWidths.goal, tableTop, { width: colWidths.action });
        doc.text('Notiz', 50 + colWidths.date + colWidths.amount + colWidths.goal + colWidths.action, tableTop, { width: colWidths.note });

        // Line under header
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#DDD');
        doc.moveDown(1);

        // Table rows
        doc.font('Helvetica').fillColor('#666');
        let rowY = doc.y;

        userSavings.forEach((saving, index) => {
          // Check if we need a new page
          if (rowY > 700) {
            doc.addPage();
            rowY = 50;
          }

          const date = saving.occurredAt ? new Date(saving.occurredAt).toLocaleDateString('de-CH') : '-';
          const amount = `CHF ${Number(saving.amountChf).toFixed(2)}`;
          const goal = saving.goalTitle || '-';
          const action = saving.actionTitle || '-';
          const note = saving.note || '-';

          doc.fontSize(8);
          doc.text(date, 50, rowY, { width: colWidths.date });
          doc.text(amount, 50 + colWidths.date, rowY, { width: colWidths.amount });
          doc.text(goal, 50 + colWidths.date + colWidths.amount, rowY, { width: colWidths.goal });
          doc.text(action, 50 + colWidths.date + colWidths.amount + colWidths.goal, rowY, { width: colWidths.action });
          doc.text(note, 50 + colWidths.date + colWidths.amount + colWidths.goal + colWidths.action, rowY, { width: colWidths.note, height: 20 });

          rowY += 25;

          // Separator line
          if (index < userSavings.length - 1) {
            doc.moveTo(50, rowY - 5).lineTo(550, rowY - 5).stroke('#EEE');
          }
        });

        // Footer
        doc.fontSize(8).fillColor('#999').text(
          'Generiert mit Syfte - Deine Spar-App',
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        doc.end();
      });

      // Set PDF headers
      setHeader(event, 'Content-Type', 'application/pdf');
      setHeader(event, 'Content-Disposition', `attachment; filename="syfte-savings-${new Date().toISOString().split('T')[0]}.pdf"`);
      
      return pdfBuffer;
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