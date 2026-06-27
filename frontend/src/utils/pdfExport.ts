import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null) {
  return `Rs. ${(n ?? 0).toFixed(2)}`;
}

function drawHeader(doc: jsPDF, company: any, title: string, docNumber: string) {
  const W = doc.internal.pageSize.getWidth();

  // Logo (top-left, if available)
  if (company.logoUrl && company.logoUrl.startsWith('data:image')) {
    try { doc.addImage(company.logoUrl, 'PNG', 14, 10, 30, 15); } catch {}
  }

  // Company block
  const cx = company.logoUrl ? 48 : 14;
  doc.setFontSize(13).setFont('helvetica', 'bold');
  doc.text(company.name ?? 'Company Name', cx, 17);
  doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(80);
  const addrParts = [company.address, company.city, company.state, company.pinCode].filter(Boolean);
  if (addrParts.length) doc.text(addrParts.join(', '), cx, 22);
  const line2 = [company.phone, company.contactEmail].filter(Boolean).join('  |  ');
  if (line2) doc.text(line2, cx, 27);
  const gstLine = [company.gstin && `GSTIN: ${company.gstin}`, company.pan && `PAN: ${company.pan}`].filter(Boolean).join('  |  ');
  if (gstLine) doc.text(gstLine, cx, 32);

  // Document title (top-right)
  doc.setFontSize(16).setFont('helvetica', 'bold').setTextColor(22, 119, 255);
  doc.text(title, W - 14, 17, { align: 'right' });
  doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(60);
  doc.text(docNumber, W - 14, 24, { align: 'right' });

  // Divider
  doc.setTextColor(0);
  doc.setDrawColor(200).line(14, 38, W - 14, 38);
}

function drawBankDetails(doc: jsPDF, company: any, y: number) {
  if (!company.bankName && !company.bankAccountNumber) return y;
  doc.setFontSize(9).setFont('helvetica', 'bold').setTextColor(50);
  doc.text('Bank Details', 14, y + 5);
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(80);
  const parts = [
    company.bankName && `Bank: ${company.bankName}`,
    company.bankBranch && `Branch: ${company.bankBranch}`,
    company.bankAccountNumber && `A/c: ${company.bankAccountNumber}`,
    company.bankIfsc && `IFSC: ${company.bankIfsc}`,
  ].filter(Boolean);
  doc.text(parts.join('   '), 14, y + 11);
  return y + 16;
}

function drawFooter(doc: jsPDF, text?: string) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFontSize(7).setTextColor(160);
  doc.text(text ?? 'This is a computer-generated document.', W / 2, H - 8, { align: 'center' });
}

// ── Quotation PDF ─────────────────────────────────────────────────────────────

export function downloadQuotationPdf(q: any, company: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeader(doc, company, 'QUOTATION', q.quoteNumber ?? '');

  // Info block
  doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(0);
  const col1 = [
    ['To', q.customer?.name ?? '—'],
    ['GSTIN', q.customer?.gstin ?? '—'],
    ['Address', q.customer?.address ?? '—'],
  ];
  const col2 = [
    ['Date', dayjs(q.quoteDate).format('DD MMM YYYY')],
    ['Valid Until', q.validUntil ? dayjs(q.validUntil).format('DD MMM YYYY') : '—'],
    ['Subject', q.subject ?? '—'],
    ['Place of Supply', q.placeOfSupply ?? '—'],
  ];
  let y = 44;
  col1.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold').text(k + ':', 14, y);
    doc.setFont('helvetica', 'normal').text(String(v), 40, y);
    y += 5;
  });
  y = 44;
  col2.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold').text(k + ':', 120, y);
    doc.setFont('helvetica', 'normal').text(String(v), 155, y);
    y += 5;
  });

  // Line items
  const items = (q.lineItems ?? []).map((item: any, i: number) => [
    i + 1,
    item.description,
    item.quantity,
    fmt(item.unitPrice),
    `${item.discountPct ?? 0}%`,
    `${item.gstRate ?? 18}%`,
    fmt((item.quantity ?? 0) * (item.unitPrice ?? 0) * (1 - (item.discountPct ?? 0) / 100)),
  ]);

  autoTable(doc, {
    startY: 70,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Disc%', 'GST%', 'Amount']],
    body: items,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 119, 255] },
    columnStyles: { 0: { cellWidth: 8 }, 6: { halign: 'right' } },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 6;

  // Totals
  const totals = [
    ['Sub Total', fmt(q.subTotal)],
    q.discountTotal ? ['Discount', `-${fmt(q.discountTotal)}`] : null,
    q.cgst ? ['CGST', fmt(q.cgst)] : null,
    q.sgst ? ['SGST', fmt(q.sgst)] : null,
    q.igst ? ['IGST', fmt(q.igst)] : null,
    ['Total Amount', fmt(q.totalAmount)],
  ].filter(Boolean) as string[][];

  const W = doc.internal.pageSize.getWidth();
  totals.forEach(([k, v], i) => {
    const bold = i === totals.length - 1;
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(bold ? 9 : 8);
    doc.text(k + ':', W - 60, finalY);
    doc.text(v, W - 14, finalY, { align: 'right' });
    finalY += 5;
  });

  finalY = drawBankDetails(doc, company, finalY + 4);
  if (q.termsConditions) {
    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(50).text('Terms & Conditions:', 14, finalY + 4);
    doc.setFont('helvetica', 'normal').setTextColor(80);
    doc.text(q.termsConditions, 14, finalY + 9, { maxWidth: W - 28 });
  }

  drawFooter(doc);
  doc.save(`${q.quoteNumber ?? 'Quotation'}.pdf`);
}

// ── Invoice PDF ───────────────────────────────────────────────────────────────

export function downloadInvoicePdf(inv: any, company: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeader(doc, company, 'TAX INVOICE', inv.invoiceNumber ?? '');

  doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(0);
  const col1 = [
    ['Bill To', inv.customer?.name ?? '—'],
    ['GSTIN', inv.customer?.gstin ?? '—'],
    ['Address', inv.customer?.address ?? '—'],
  ];
  const col2 = [
    ['Invoice Date', dayjs(inv.issueDate ?? inv.createdAt).format('DD MMM YYYY')],
    ['Due Date', inv.dueDate ? dayjs(inv.dueDate).format('DD MMM YYYY') : '—'],
    ['Place of Supply', inv.placeOfSupply ?? '—'],
    ['Customer PO', inv.customerPoNumber ?? '—'],
  ];
  let y = 44;
  col1.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold').text(k + ':', 14, y);
    doc.setFont('helvetica', 'normal').text(String(v), 40, y);
    y += 5;
  });
  y = 44;
  col2.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold').text(k + ':', 120, y);
    doc.setFont('helvetica', 'normal').text(String(v), 155, y);
    y += 5;
  });

  const items = (inv.lineItems ?? []).map((item: any, i: number) => [
    i + 1,
    item.description,
    item.quantity,
    fmt(item.unitPrice),
    `${item.discountPct ?? 0}%`,
    `${item.gstRate ?? 18}%`,
    fmt((item.quantity ?? 0) * (item.unitPrice ?? 0) * (1 - (item.discountPct ?? 0) / 100)),
  ]);

  autoTable(doc, {
    startY: 70,
    head: [['#', 'Description', 'Qty', 'Rate', 'Disc%', 'GST%', 'Amount']],
    body: items,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 119, 255] },
    columnStyles: { 0: { cellWidth: 8 }, 6: { halign: 'right' } },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 6;
  const W = doc.internal.pageSize.getWidth();

  const totals = [
    ['Sub Total', fmt(inv.subTotal)],
    inv.discountTotal ? ['Discount', `-${fmt(inv.discountTotal)}`] : null,
    inv.cgst ? ['CGST', fmt(inv.cgst)] : null,
    inv.sgst ? ['SGST', fmt(inv.sgst)] : null,
    inv.igst ? ['IGST', fmt(inv.igst)] : null,
    ['Total Amount', fmt(inv.totalAmount)],
  ].filter(Boolean) as string[][];

  totals.forEach(([k, v], i) => {
    const bold = i === totals.length - 1;
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(bold ? 9 : 8);
    doc.text(k + ':', W - 60, finalY);
    doc.text(v, W - 14, finalY, { align: 'right' });
    finalY += 5;
  });

  finalY = drawBankDetails(doc, company, finalY + 4);

  if (inv.notes) {
    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(50).text('Notes:', 14, finalY + 4);
    doc.setFont('helvetica', 'normal').setTextColor(80).text(inv.notes, 14, finalY + 9, { maxWidth: W - 28 });
  }

  drawFooter(doc);
  doc.save(`${inv.invoiceNumber ?? 'Invoice'}.pdf`);
}

// ── Purchase Order PDF ────────────────────────────────────────────────────────

export function downloadPurchaseOrderPdf(po: any, company: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeader(doc, company, 'PURCHASE ORDER', po.poNumber ?? '');

  doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(0);
  const col1 = [
    ['Supplier', po.supplier?.name ?? '—'],
    ['GSTIN', po.supplier?.gstin ?? '—'],
    ['Address', po.supplier?.address ?? '—'],
  ];
  const col2 = [
    ['PO Date', dayjs(po.poDate).format('DD MMM YYYY')],
    ['Expected By', po.expectedDate ? dayjs(po.expectedDate).format('DD MMM YYYY') : '—'],
    ['Payment Terms', po.paymentTerms ?? '—'],
    ['Supplier Ref', po.supplierRef ?? '—'],
  ];
  let y = 44;
  col1.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold').text(k + ':', 14, y);
    doc.setFont('helvetica', 'normal').text(String(v), 40, y);
    y += 5;
  });
  y = 44;
  col2.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold').text(k + ':', 120, y);
    doc.setFont('helvetica', 'normal').text(String(v), 155, y);
    y += 5;
  });

  const items = (po.lineItems ?? []).map((item: any, i: number) => [
    i + 1,
    item.description,
    item.quantity,
    fmt(item.unitPrice),
    `${item.discountPct ?? 0}%`,
    `${item.gstRate ?? 18}%`,
    fmt((item.quantity ?? 0) * (item.unitPrice ?? 0) * (1 - (item.discountPct ?? 0) / 100)),
  ]);

  autoTable(doc, {
    startY: 70,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Disc%', 'GST%', 'Amount']],
    body: items,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 119, 255] },
    columnStyles: { 0: { cellWidth: 8 }, 6: { halign: 'right' } },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 6;
  const W = doc.internal.pageSize.getWidth();

  const totals = [
    ['Sub Total', fmt(po.subTotal)],
    po.cgst ? ['CGST', fmt(po.cgst)] : null,
    po.sgst ? ['SGST', fmt(po.sgst)] : null,
    po.igst ? ['IGST', fmt(po.igst)] : null,
    ['Total Amount', fmt(po.totalAmount)],
  ].filter(Boolean) as string[][];

  totals.forEach(([k, v], i) => {
    const bold = i === totals.length - 1;
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(bold ? 9 : 8);
    doc.text(k + ':', W - 60, finalY);
    doc.text(v, W - 14, finalY, { align: 'right' });
    finalY += 5;
  });

  if (po.deliveryAddress) {
    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(50).text('Delivery Address:', 14, finalY + 5);
    doc.setFont('helvetica', 'normal').setTextColor(80).text(po.deliveryAddress, 14, finalY + 10, { maxWidth: 100 });
  }
  if (po.notes) {
    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(50).text('Notes:', 14, finalY + 18);
    doc.setFont('helvetica', 'normal').setTextColor(80).text(po.notes, 14, finalY + 23, { maxWidth: W - 28 });
  }

  drawFooter(doc);
  doc.save(`${po.poNumber ?? 'PurchaseOrder'}.pdf`);
}

// ── Delivery Challan PDF ──────────────────────────────────────────────────────

export function downloadChallanPdf(dc: any, company: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeader(doc, company, 'DELIVERY CHALLAN', dc.challanNumber ?? '');

  doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(0);
  const col1 = [
    ['Deliver To', dc.customer?.name ?? '—'],
    ['GSTIN', dc.customer?.gstin ?? '—'],
    ['Address', dc.deliveryAddress ?? dc.customer?.address ?? '—'],
  ];
  const col2 = [
    ['Challan Date', dayjs(dc.challanDate).format('DD MMM YYYY')],
    ['Type', dc.challanType ?? '—'],
    ['Expected Delivery', dc.expectedDelivery ? dayjs(dc.expectedDelivery).format('DD MMM YYYY') : '—'],
    ['E-Way Bill', dc.eWayBillNumber ?? '—'],
  ];
  let y = 44;
  col1.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold').text(k + ':', 14, y);
    doc.setFont('helvetica', 'normal').text(String(v), 42, y);
    y += 5;
  });
  y = 44;
  col2.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold').text(k + ':', 120, y);
    doc.setFont('helvetica', 'normal').text(String(v), 155, y);
    y += 5;
  });

  const items = (dc.lineItems ?? []).map((item: any, i: number) => [
    i + 1,
    item.description,
    item.quantity,
    item.unit ?? '—',
    item.remarks ?? '',
  ]);

  autoTable(doc, {
    startY: 70,
    head: [['#', 'Description', 'Qty', 'Unit', 'Remarks']],
    body: items,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 119, 255] },
    columnStyles: { 0: { cellWidth: 8 } },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 6;

  // Logistics section
  if (dc.transportMode || dc.vehicleNumber || dc.lrNumber) {
    autoTable(doc, {
      startY: finalY,
      head: [['Transport Mode', 'Transporter', 'Vehicle No.', 'LR Number', 'Driver', 'Packages']],
      body: [[
        dc.transportMode ?? '—', dc.transporterName ?? '—', dc.vehicleNumber ?? '—',
        dc.lrNumber ?? '—', dc.driverName ?? '—', dc.numberOfPackages ?? '—',
      ]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [80, 80, 80] },
    });
    finalY = (doc as any).lastAutoTable.finalY + 6;
  }

  // Signature block
  const W = doc.internal.pageSize.getWidth();
  doc.setFontSize(8).setTextColor(80);
  doc.text('Authorised Signatory', W - 14, finalY + 20, { align: 'right' });
  doc.line(W - 60, finalY + 18, W - 14, finalY + 18);
  doc.text('Receiver Signature', 14, finalY + 20);
  doc.line(14, finalY + 18, 60, finalY + 18);

  drawFooter(doc);
  doc.save(`${dc.challanNumber ?? 'DeliveryChallan'}.pdf`);
}
