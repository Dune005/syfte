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

    // Fetch all user savings with related data (newest first)
    const userSavings = await db
      .select({
        id: savings.id,
        amountChf: savings.amountChf,
        note: savings.note,
        occurredAt: savings.occurredAt,
        createdAt: savings.createdAt,
        goalId: savings.goalId,
        goalTitle: goals.title,
        actionTitle: actions.title,
        actionDescription: actions.description
      })
      .from(savings)
      .leftJoin(goals, eq(savings.goalId, goals.id))
      .leftJoin(actions, eq(savings.actionId, actions.id))
      .where(eq(savings.userId, userId))
      .orderBy(desc(savings.occurredAt));

    // Calculate total amount and get date range
    const totalAmount = userSavings.reduce((sum, s) => sum + Number(s.amountChf), 0);
    const oldestDate = userSavings.length > 0 ? userSavings[userSavings.length - 1].occurredAt : null;
    const newestDate = userSavings.length > 0 ? userSavings[0].occurredAt : null;
    
    // Group savings by goal for detailed breakdown
    const savingsByGoal = userSavings.reduce((acc, saving) => {
      const goalKey = saving.goalId || 0;
      if (!acc[goalKey]) {
        acc[goalKey] = {
          goalTitle: saving.goalTitle || 'Kein Sparziel',
          savings: [],
          total: 0
        };
      }
      acc[goalKey].savings.push(saving);
      acc[goalKey].total += Number(saving.amountChf);
      return acc;
    }, {} as Record<number, { goalTitle: string; savings: typeof userSavings; total: number }>);

    if (format === 'csv') {
      const escapeCsv = (str: string | null) => {
        if (!str) return '';
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      let csvContent = '';
      
      // Summary Section
      csvContent += 'ZUSAMMENFASSUNG\n';
      csvContent += `Zeitraum,${oldestDate ? new Date(oldestDate).toLocaleDateString('de-CH') : '-'} bis ${newestDate ? new Date(newestDate).toLocaleDateString('de-CH') : '-'}\n`;
      csvContent += `Gesamtbetrag gespart,CHF ${totalAmount.toFixed(2)}\n`;
      csvContent += `Anzahl Transaktionen,${userSavings.length}\n`;
      csvContent += '\n';

      // All Transactions Section
      csvContent += 'ALLE TRANSAKTIONEN\n';
      csvContent += 'Datum,Betrag,Sparziel,Aktion,Notiz\n';
      userSavings.forEach(saving => {
        const note = saving.actionDescription || saving.note || '';
        csvContent += [
          saving.occurredAt ? new Date(saving.occurredAt).toLocaleDateString('de-CH') : '-',
          `CHF ${Number(saving.amountChf).toFixed(2)}`,
          escapeCsv(saving.goalTitle || '-'),
          escapeCsv(saving.actionTitle || '-'),
          escapeCsv(note)
        ].join(',') + '\n';
      });
      csvContent += '\n';

      // Breakdown by Goal
      csvContent += 'DETAILLIERTE AUFSCHLÜSSELUNG PRO SPARZIEL\n';
      Object.values(savingsByGoal).forEach(goalData => {
        csvContent += `\n"${goalData.goalTitle}",Gesamt: CHF ${goalData.total.toFixed(2)}\n`;
        csvContent += 'Datum,Betrag,Aktion,Notiz\n';
        goalData.savings.forEach(saving => {
          const note = saving.actionDescription || saving.note || '';
          csvContent += [
            saving.occurredAt ? new Date(saving.occurredAt).toLocaleDateString('de-CH') : '-',
            `CHF ${Number(saving.amountChf).toFixed(2)}`,
            escapeCsv(saving.actionTitle || '-'),
            escapeCsv(note)
          ].join(',') + '\n';
        });
      });

      // Set CSV headers
      setHeader(event, 'Content-Type', 'text/csv');
      setHeader(event, 'Content-Disposition', `attachment; filename="syfte-savings-${new Date().toISOString().split('T')[0]}.csv"`);
      
      return csvContent;
    }

    if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument({ 
        margin: 50,
        bufferPages: true // Enable page buffering for page numbers
      });
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
        doc.fontSize(14).fillColor('#1E232C').text('Zusammenfassung', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#666');
        const dateRangeText = oldestDate && newestDate 
          ? `${new Date(oldestDate).toLocaleDateString('de-CH')} bis ${new Date(newestDate).toLocaleDateString('de-CH')}`
          : 'Keine Transaktionen';
        doc.text(`Zeitraum: ${dateRangeText}`);
        doc.text('Gesamtbetrag gespart: ', { continued: true });
        doc.font('Helvetica-Bold').text(`CHF ${totalAmount.toFixed(2)}`);
        doc.font('Helvetica').text(`Anzahl Transaktionen: ${userSavings.length}`);
        doc.moveDown(2);

        // All Transactions table
        doc.fontSize(14).fillColor('#1E232C').text('Alle Transaktionen', { underline: true });
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
          const note = saving.actionDescription || saving.note || '-';

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

        // Breakdown by Goal Section - Title as separate section
        if (doc.y > 650) {
          doc.addPage();
        }
        doc.moveDown(3);
        doc.fontSize(14).fillColor('#1E232C').font('Helvetica-Bold').text('Detaillierte Aufschlüsselung pro Sparziel', 50, doc.y, { underline: true, align: 'left' });
        doc.moveDown(2);

        Object.values(savingsByGoal).forEach((goalData, goalIndex) => {
          // Check if we need a new page
          if (doc.y > 650) {
            doc.addPage();
          }

          // Goal header
          doc.fontSize(12).fillColor('#35C2C1').font('Helvetica-Bold');
          doc.text(goalData.goalTitle, 50, doc.y, { continued: false, align: 'left' });
          doc.fontSize(10).fillColor('#666').font('Helvetica');
          doc.text(`Gesamt: CHF ${goalData.total.toFixed(2)} (${goalData.savings.length} Transaktionen)`, 50, doc.y, { align: 'left' });
          doc.moveDown(0.5);

          // Mini table for this goal
          const miniTableTop = doc.y;
          doc.fontSize(8).fillColor('#35C2C1').font('Helvetica-Bold');
          doc.text('Datum', 50, miniTableTop, { width: 80 });
          doc.text('Betrag', 130, miniTableTop, { width: 70 });
          doc.text('Aktion', 200, miniTableTop, { width: 120 });
          doc.text('Notiz', 320, miniTableTop, { width: 230 });
          
          doc.moveTo(50, miniTableTop + 12).lineTo(550, miniTableTop + 12).stroke('#DDD');
          doc.moveDown(0.8);

          // Transactions for this goal
          doc.font('Helvetica').fillColor('#666');
          goalData.savings.forEach((saving, idx) => {
            if (doc.y > 700) {
              doc.addPage();
            }

            const date = saving.occurredAt ? new Date(saving.occurredAt).toLocaleDateString('de-CH') : '-';
            const amount = `CHF ${Number(saving.amountChf).toFixed(2)}`;
            const action = saving.actionTitle || '-';
            const note = saving.actionDescription || saving.note || '-';

            const currentY = doc.y;
            doc.fontSize(7);
            doc.text(date, 50, currentY, { width: 80 });
            doc.text(amount, 130, currentY, { width: 70 });
            doc.text(action, 200, currentY, { width: 120, height: 15 });
            doc.text(note, 320, currentY, { width: 230, height: 15 });

            doc.moveDown(1.2);
          });

          doc.moveDown(1.5);
          if (goalIndex < Object.values(savingsByGoal).length - 1) {
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#CCC');
            doc.moveDown(2.5);
          }
        });

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