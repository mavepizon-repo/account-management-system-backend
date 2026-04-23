const PDFDocument = require("pdfkit");

exports.generatePDF = (data, month, res) => {
  const doc = new PDFDocument({ margin: 30 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=attendance-${month}.pdf`
  );

  doc.pipe(res);

  // Title
  doc.fontSize(18).text(`Labour Attendance Report - ${month}`, {
    align: "center"
  });

  doc.moveDown();

  // Table header
  doc.fontSize(12);
  doc.text("Date", 50, 100);
  doc.text("Labour ID", 120, 100);
  doc.text("Name", 200, 100);
  doc.text("Work Type", 280, 100);
  doc.text("Hours", 380, 100);
  doc.text("OT", 450, 100);

  doc.moveTo(50, 115).lineTo(550, 115).stroke(); // line

  let y = 130;

  // Table rows
  data.forEach((item) => {
    doc.text(item.date, 50, y);
    doc.text(item.labourId, 120, y);
    doc.text(item.name, 200, y);
    doc.text(item.workType, 280, y);
    doc.text(item.totalHours.toFixed(2), 380, y);
    doc.text(item.overtime.toFixed(2), 450, y);

    y += 20;
  });

  doc.end();
};