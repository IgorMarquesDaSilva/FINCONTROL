const { PDFDocument } = require('pdfkit');
const { periodBounds } = require('./period');

function formatMoney(value, preferences) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: preferences.currency,
  }).format(Number(value) || 0);
}

function formatDate(isoDate, preferences) {
  const [year, month, day] = String(isoDate).slice(0, 10).split('-');
  if (preferences.dateFormat === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  if (preferences.dateFormat === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  return `${day}/${month}/${year}`;
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function buildTransactionsCsv(transactions, preferences) {
  const rows = [['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor']];
  transactions.forEach((transaction) => rows.push([
    formatDate(transaction.transactionDate, preferences),
    transaction.type === 'INCOME' ? 'Receita' : 'Despesa',
    transaction.description,
    transaction.category.name,
    formatMoney(transaction.amount, preferences),
  ]));
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}\r\n`;
}

function buildMonthlyPdf(report, preferences) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    const pageWidth = doc.page.width;
    const dark = '#071f30';
    const green = '#008a65';
    let y = 0;

    function pageHeader(continued = false) {
      doc.rect(0, 0, pageWidth, 112).fill(dark);
      doc.fillColor('#56e0ad').font('Helvetica-Bold').fontSize(10).text('FINCONTROL', 48, 31);
      doc.fillColor('#ffffff').fontSize(22).text('Relatório mensal', 48, 54);
      if (continued) doc.font('Helvetica').fontSize(9).text('Continuação', pageWidth - 120, 64, { width: 72, align: 'right' });
      y = 138;
    }

    function ensureSpace(height) {
      if (y + height <= doc.page.height - 62) return;
      doc.addPage();
      pageHeader(true);
    }

    function heading(title) {
      ensureSpace(42);
      doc.fillColor(dark).font('Helvetica-Bold').fontSize(13).text(title, 48, y);
      y += 29;
    }

    function tableRow(left, right, index) {
      ensureSpace(31);
      if (index % 2 === 0) doc.rect(48, y - 5, pageWidth - 96, 29).fill('#f2f7f6');
      doc.fillColor(dark).font('Helvetica').fontSize(10).text(left, 58, y + 3, { width: 325, ellipsis: true, lineBreak: false });
      doc.font('Helvetica-Bold').text(right, 386, y + 3, { width: pageWidth - 444, align: 'right', lineBreak: false });
      y += 30;
    }

    pageHeader();
    const { start, end } = periodBounds(report.period.year, report.period.month, preferences.monthStartDay);
    const lastDay = new Date(new Date(`${end}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10);
    doc.fillColor('#526873').font('Helvetica').fontSize(10)
      .text(`Período: ${formatDate(start, preferences)} a ${formatDate(lastDay, preferences)}`, 48, y);
    y += 37;
    const cards = [
      ['Receitas', report.current.income, green],
      ['Despesas', report.current.expense, '#c65b3d'],
      ['Saldo', report.current.balance, dark],
    ];
    const cardWidth = (pageWidth - 96 - 20) / 3;
    cards.forEach(([label, value, color], index) => {
      const x = 48 + index * (cardWidth + 10);
      doc.roundedRect(x, y, cardWidth, 78, 8).fill('#f2f7f6');
      doc.fillColor('#526873').font('Helvetica').fontSize(9).text(label, x + 13, y + 15, { width: cardWidth - 26 });
      doc.fillColor(color).font('Helvetica-Bold').fontSize(15).text(formatMoney(value, preferences), x + 13, y + 37, { width: cardWidth - 26, ellipsis: true, lineBreak: false });
    });
    y += 106;
    doc.fillColor('#526873').font('Helvetica').fontSize(10)
      .text(`${report.current.transactionCount} movimentações no período`, 48, y);
    y += 40;
    heading('Despesas por categoria');
    if (!report.expenseCategories.length) tableRow('Nenhuma despesa registrada', '', 0);
    else report.expenseCategories.forEach((category, index) => {
      tableRow(category.name, formatMoney(category.amount, preferences), index);
    });
    y += 23;
    heading('Maiores despesas');
    if (!report.topExpenses.length) tableRow('Nenhuma despesa registrada', '', 0);
    else report.topExpenses.forEach((expense, index) => {
      tableRow(`${formatDate(expense.transactionDate, preferences)}  ${expense.description}`, formatMoney(expense.amount, preferences), index);
    });

    const pageCount = doc.bufferedPageRange().count;
    for (let page = 0; page < pageCount; page += 1) {
      doc.switchToPage(page);
      doc.moveTo(48, doc.page.height - 68).lineTo(pageWidth - 48, doc.page.height - 68)
        .strokeColor('#d9e3e3').stroke();
      doc.fillColor('#61717b').font('Helvetica').fontSize(8)
        .text(`FINCONTROL · Relatório pessoal · Página ${page + 1} de ${pageCount}`, 48, doc.page.height - 59, { width: pageWidth - 96, align: 'right' });
    }
    doc.end();
  });
}

module.exports = { formatMoney, formatDate, csvCell, buildTransactionsCsv, buildMonthlyPdf };
