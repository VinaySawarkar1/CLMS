import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

// ── colour palette ────────────────────────────────────────────────────────────
const C = {
  primary:   [15, 52, 96]  as [number,number,number],  // deep navy
  accent:    [0, 120, 212] as [number,number,number],  // blue
  light:     [230, 240, 252] as [number,number,number], // pale blue bg
  dark:      [30, 30, 30]  as [number,number,number],
  muted:     [100, 100, 100] as [number,number,number],
  border:    [180, 200, 220] as [number,number,number],
  white:     [255, 255, 255] as [number,number,number],
};

// ── helpers ───────────────────────────────────────────────────────────────────

function rupee(n: number | undefined | null) {
  return `₹ ${(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen',
  'Eighteen','Nineteen'];
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function numWords(n: number): string {
  if (n === 0) return 'Zero';
  if (n < 0) return 'Minus ' + numWords(-n);
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numWords(n % 100) : '');
  if (n < 100000) return numWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numWords(n % 1000) : '');
  if (n < 10000000) return numWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numWords(n % 100000) : '');
  return numWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numWords(n % 10000000) : '');
}

function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let str = numWords(rupees) + ' Rupees';
  if (paise > 0) str += ' and ' + numWords(paise) + ' Paise';
  return str + ' Only';
}

// ── page header: lab logo + details ──────────────────────────────────────────

function drawPageHeader(doc: jsPDF, company: any, docTitle: string, docMeta: { label: string; value: string }[]) {
  const W = doc.internal.pageSize.getWidth();

  // Full-width header background band
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, W, 38, 'F');

  // Logo (top-right inside header)
  let logoEndX = W - 10;
  if (company.logoUrl && company.logoUrl.startsWith('data:image')) {
    try {
      doc.addImage(company.logoUrl, 'PNG', W - 44, 5, 34, 18);
      logoEndX = W - 46;
    } catch { /* ignore */ }
  }

  // Lab name + address (top-left inside header)
  doc.setTextColor(...C.white);
  doc.setFontSize(14).setFont('helvetica', 'bold');
  doc.text(company.name ?? 'Laboratory Name', 10, 13);

  doc.setFontSize(7.5).setFont('helvetica', 'normal');
  const addr = [company.address, company.city, company.state, company.pinCode].filter(Boolean).join(', ');
  if (addr) doc.text(addr, 10, 19);
  const contact = [company.phone && `Ph: ${company.phone}`, company.contactEmail && `Email: ${company.contactEmail}`].filter(Boolean).join('   ');
  if (contact) doc.text(contact, 10, 24.5);
  const gst = [company.gstin && `GSTIN: ${company.gstin}`, company.pan && `PAN: ${company.pan}`].filter(Boolean).join('   ');
  if (gst) doc.text(gst, 10, 30);

  // Document title band (accent stripe)
  doc.setFillColor(...C.accent);
  doc.rect(0, 38, W, 9, 'F');
  doc.setTextColor(...C.white).setFontSize(11).setFont('helvetica', 'bold');
  doc.text(docTitle, W / 2, 44.5, { align: 'center' });

  // Meta info row (doc number, date, etc.) — right-aligned below title stripe
  doc.setFillColor(...C.light);
  doc.rect(0, 47, W, 12, 'F');
  doc.setTextColor(...C.dark).setFontSize(8).setFont('helvetica', 'normal');
  const colW = (W - 20) / docMeta.length;
  docMeta.forEach((m, i) => {
    const x = 10 + i * colW;
    doc.setFont('helvetica', 'bold').text(m.label + ':', x, 52);
    doc.setFont('helvetica', 'normal').text(m.value, x + 22, 52);
  });

  doc.setTextColor(...C.dark);
  return 62; // y where content starts
}

// ── customer / party details box ──────────────────────────────────────────────

function drawPartyBox(
  doc: jsPDF,
  startY: number,
  left: { heading: string; name: string; gstin?: string; address?: string; city?: string; state?: string; pinCode?: string; phone?: string; email?: string },
  right?: { heading: string; name?: string; address?: string; city?: string; state?: string; pinCode?: string } | null,
) {
  const W = doc.internal.pageSize.getWidth();
  const boxH = 34;
  const midX = W / 2;

  // Left box
  doc.setFillColor(...C.light);
  doc.roundedRect(10, startY, midX - 14, boxH, 2, 2, 'F');
  doc.setDrawColor(...C.border);
  doc.roundedRect(10, startY, midX - 14, boxH, 2, 2, 'S');

  doc.setFillColor(...C.primary);
  doc.roundedRect(10, startY, midX - 14, 7, 2, 2, 'F');
  doc.rect(10, startY + 3.5, midX - 14, 3.5, 'F'); // flatten bottom corners of header
  doc.setTextColor(...C.white).setFontSize(7.5).setFont('helvetica', 'bold');
  doc.text(left.heading, 14, startY + 5.2);

  doc.setTextColor(...C.dark);
  let ly = startY + 12;
  doc.setFont('helvetica', 'bold').setFontSize(8.5);
  doc.text(left.name ?? '—', 14, ly); ly += 5;
  doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...C.muted);
  if (left.gstin) { doc.text(`GSTIN: ${left.gstin}`, 14, ly); ly += 4.5; }
  const addrLine = [left.address, left.city, left.state, left.pinCode].filter(Boolean).join(', ');
  if (addrLine) {
    const wrapped = doc.splitTextToSize(addrLine, midX - 28);
    doc.text(wrapped, 14, ly); ly += wrapped.length * 4;
  }
  if (left.phone) { doc.text(`Mob: ${left.phone}`, 14, ly); ly += 4.5; }
  if (left.email) { doc.text(`Email: ${left.email}`, 14, ly); }

  // Right box (optional — ship-to / delivery address)
  if (right) {
    doc.setFillColor(...C.light);
    doc.roundedRect(midX + 4, startY, midX - 14, boxH, 2, 2, 'F');
    doc.setDrawColor(...C.border);
    doc.roundedRect(midX + 4, startY, midX - 14, boxH, 2, 2, 'S');

    doc.setFillColor(...C.primary);
    doc.roundedRect(midX + 4, startY, midX - 14, 7, 2, 2, 'F');
    doc.rect(midX + 4, startY + 3.5, midX - 14, 3.5, 'F');
    doc.setTextColor(...C.white).setFontSize(7.5).setFont('helvetica', 'bold');
    doc.text(right.heading, midX + 8, startY + 5.2);

    doc.setTextColor(...C.dark);
    let ry = startY + 12;
    doc.setFont('helvetica', 'bold').setFontSize(8.5);
    doc.text(right.name ?? '—', midX + 8, ry); ry += 5;
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...C.muted);
    const rAddr = [right.address, right.city, right.state, right.pinCode].filter(Boolean).join(', ');
    if (rAddr) { const w = doc.splitTextToSize(rAddr, midX - 24); doc.text(w, midX + 8, ry); }
  }

  doc.setTextColor(...C.dark);
  return startY + boxH + 5;
}

// ── GST items table ───────────────────────────────────────────────────────────

function drawItemsTable(doc: jsPDF, items: any[], startY: number) {
  const rows = items.map((item: any, i: number) => {
    const qty  = item.quantity ?? 0;
    const rate = item.unitPrice ?? 0;
    const disc = item.discountPct ?? 0;
    const gst  = item.gstRate ?? 18;
    const taxable = qty * rate * (1 - disc / 100);
    const gstAmt  = taxable * gst / 100;
    return [
      i + 1,
      item.description ?? '',
      qty,
      item.unit ?? 'Nos',
      rupee(rate),
      disc ? `${disc}%` : '—',
      rupee(taxable),
      `${gst}%`,
      rupee(taxable + gstAmt),
    ];
  });

  autoTable(doc, {
    startY,
    head: [['#', 'Item & Description', 'Qty', 'Unit', 'Rate', 'Disc%', 'Taxable Amt', 'GST%', 'Amount']],
    body: rows,
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: C.primary, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [245, 249, 255] },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 26, halign: 'right' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 26, halign: 'right' },
    },
    margin: { left: 10, right: 10 },
  });

  return (doc as any).lastAutoTable.finalY;
}

// ── totals block ──────────────────────────────────────────────────────────────

function drawTotals(doc: jsPDF, data: any, startY: number): number {
  const W = doc.internal.pageSize.getWidth();
  const col1X = 10;
  const col2X = W / 2 + 4;
  const rightEdge = W - 10;
  const labelW  = 50;

  const rows: [string, number | null][] = [
    ['Sub Total', data.subTotal],
    ...(data.discountTotal ? [['Discount (-)', -Math.abs(data.discountTotal)] as [string, number]] : []),
    ...(data.cgst ? [['CGST', data.cgst] as [string, number]] : []),
    ...(data.sgst ? [['SGST', data.sgst] as [string, number]] : []),
    ...(data.igst ? [['IGST', data.igst] as [string, number]] : []),
  ];

  // Amount-in-words on the left, totals on the right
  const totalAmt = data.totalAmount ?? 0;

  // Totals box
  const boxX = col2X - 5;
  const boxW = rightEdge - boxX;
  const rowH = 6;
  const boxH = rows.length * rowH + 12;
  doc.setFillColor(...C.light);
  doc.roundedRect(boxX, startY, boxW, boxH, 2, 2, 'F');
  doc.setDrawColor(...C.border);
  doc.roundedRect(boxX, startY, boxW, boxH, 2, 2, 'S');

  let ty = startY + 5.5;
  rows.forEach(([label, val]) => {
    doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(...C.muted);
    doc.text(label + ':', boxX + 4, ty);
    doc.text(rupee(val ?? 0), rightEdge - 2, ty, { align: 'right' });
    ty += rowH;
  });

  // Grand total stripe
  doc.setFillColor(...C.primary);
  doc.rect(boxX, ty - 1, boxW, 8, 'F');
  doc.setTextColor(...C.white).setFontSize(9).setFont('helvetica', 'bold');
  doc.text('Grand Total', boxX + 4, ty + 4.5);
  doc.text(rupee(totalAmt), rightEdge - 2, ty + 4.5, { align: 'right' });

  // Amount in words on the left side
  doc.setTextColor(...C.dark).setFontSize(7.5).setFont('helvetica', 'italic');
  const words = amountInWords(totalAmt);
  const maxW = col2X - col1X - 10;
  doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...C.muted);
  doc.text('Amount in Words:', col1X, startY + 5.5);
  doc.setFont('helvetica', 'italic').setTextColor(...C.dark);
  const wrapped = doc.splitTextToSize(words, maxW);
  doc.text(wrapped, col1X, startY + 11);

  return startY + boxH + 6;
}

// ── bank details ──────────────────────────────────────────────────────────────

function drawBankDetails(doc: jsPDF, company: any, y: number): number {
  if (!company.bankName && !company.bankAccountNumber) return y;
  const W = doc.internal.pageSize.getWidth();
  const boxW = (W - 20) / 2;

  doc.setFillColor(...C.light);
  doc.roundedRect(10, y, boxW, 26, 2, 2, 'F');
  doc.setDrawColor(...C.border);
  doc.roundedRect(10, y, boxW, 26, 2, 2, 'S');

  doc.setFillColor(...C.primary);
  doc.roundedRect(10, y, boxW, 7, 2, 2, 'F');
  doc.rect(10, y + 3.5, boxW, 3.5, 'F');
  doc.setTextColor(...C.white).setFontSize(7.5).setFont('helvetica', 'bold');
  doc.text('Bank Details', 14, y + 5.2);

  const fields = [
    company.bankName && `Bank: ${company.bankName}`,
    company.bankBranch && `Branch: ${company.bankBranch}`,
    company.bankAccountNumber && `A/c No: ${company.bankAccountNumber}`,
    company.bankIfsc && `IFSC: ${company.bankIfsc}`,
  ].filter(Boolean) as string[];

  doc.setTextColor(...C.muted).setFontSize(7.5).setFont('helvetica', 'normal');
  fields.forEach((f, i) => doc.text(f, 14, y + 12 + i * 4.2));

  return y + 32;
}

// ── terms & conditions ────────────────────────────────────────────────────────

function drawTerms(doc: jsPDF, text: string | undefined, y: number, x2col = false): number {
  if (!text) return y;
  const W = doc.internal.pageSize.getWidth();
  const startX = x2col ? W / 2 + 4 : 10;
  const colW = x2col ? W / 2 - 14 : W - 20;

  doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(...C.dark);
  doc.text('Terms & Conditions:', startX, y);
  doc.setFont('helvetica', 'normal').setTextColor(...C.muted).setFontSize(7);
  const lines = doc.splitTextToSize(text, colW);
  doc.text(lines, startX, y + 5);
  return y + 5 + lines.length * 3.8;
}

// ── signature block ───────────────────────────────────────────────────────────

function drawSignature(doc: jsPDF, company: any, y: number) {
  const W = doc.internal.pageSize.getWidth();
  doc.setDrawColor(...C.border);
  doc.line(W - 70, y + 14, W - 10, y + 14);
  doc.setFontSize(7.5).setFont('helvetica', 'bold').setTextColor(...C.dark);
  doc.text(`For, ${company.name ?? ''}`, W - 40, y + 3, { align: 'center' });
  if (company.signatureUrl && company.signatureUrl.startsWith('data:image')) {
    try { doc.addImage(company.signatureUrl, 'PNG', W - 65, y + 4, 25, 10); } catch { /* ignore */ }
  }
  doc.setFont('helvetica', 'normal').setTextColor(...C.muted).setFontSize(7);
  doc.text('Authorised Signatory', W - 40, y + 19, { align: 'center' });
}

// ── footer ────────────────────────────────────────────────────────────────────

function drawFooter(doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(...C.primary);
  doc.rect(0, H - 10, W, 10, 'F');
  doc.setFontSize(6.5).setTextColor(...C.white).setFont('helvetica', 'normal');
  doc.text('This is a computer-generated document. No signature required if generated electronically.', W / 2, H - 5.5, { align: 'center' });
}

// ── QUOTATION ─────────────────────────────────────────────────────────────────

export function downloadQuotationPdf(q: any, company: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const meta = [
    { label: 'Quotation No', value: q.quoteNumber ?? '—' },
    { label: 'Date', value: q.quoteDate ? dayjs(q.quoteDate).format('DD/MM/YYYY') : '—' },
    { label: 'Valid Until', value: q.validUntil ? dayjs(q.validUntil).format('DD/MM/YYYY') : '—' },
    { label: 'Place of Supply', value: q.placeOfSupply ?? '—' },
  ];

  let y = drawPageHeader(doc, company, 'QUOTATION', meta);

  y = drawPartyBox(doc, y,
    {
      heading: 'Bill To',
      name: q.customer?.name,
      gstin: q.customer?.gstin,
      address: q.customer?.billingAddress ?? q.customer?.address,
      city: q.customer?.billingCity,
      state: q.customer?.billingState,
      pinCode: q.customer?.billingPinCode,
      phone: q.customer?.phone,
      email: q.customer?.email,
    },
    q.subject ? { heading: 'Subject / Reference', name: q.subject } : null,
  );

  y = drawItemsTable(doc, q.lineItems ?? [], y);
  y = drawTotals(doc, q, y + 5);
  y = drawBankDetails(doc, company, y);
  drawTerms(doc, q.termsConditions, y + 5, true);
  drawSignature(doc, company, y + 5);
  drawFooter(doc);

  doc.save(`${q.quoteNumber ?? 'Quotation'}.pdf`);
}

// ── INVOICE ───────────────────────────────────────────────────────────────────

export function downloadInvoicePdf(inv: any, company: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const meta = [
    { label: 'Invoice No', value: inv.invoiceNumber ?? '—' },
    { label: 'Invoice Date', value: inv.issueDate ? dayjs(inv.issueDate).format('DD/MM/YYYY') : dayjs(inv.createdAt).format('DD/MM/YYYY') },
    { label: 'Due Date', value: inv.dueDate ? dayjs(inv.dueDate).format('DD/MM/YYYY') : '—' },
    { label: 'Place of Supply', value: inv.placeOfSupply ?? '—' },
  ];

  let y = drawPageHeader(doc, company, 'TAX INVOICE', meta);

  y = drawPartyBox(doc, y,
    {
      heading: 'Bill To',
      name: inv.customer?.name,
      gstin: inv.customer?.gstin,
      address: inv.customer?.billingAddress ?? inv.customer?.address,
      city: inv.customer?.billingCity,
      state: inv.customer?.billingState,
      pinCode: inv.customer?.billingPinCode,
      phone: inv.customer?.phone,
      email: inv.customer?.email,
    },
    inv.customerPoNumber
      ? { heading: 'Customer PO Reference', name: inv.customerPoNumber }
      : null,
  );

  y = drawItemsTable(doc, inv.lineItems ?? [], y);
  y = drawTotals(doc, inv, y + 5);
  y = drawBankDetails(doc, company, y);
  if (inv.notes) drawTerms(doc, inv.notes, y + 5, true);
  drawSignature(doc, company, y + 5);
  drawFooter(doc);

  doc.save(`${inv.invoiceNumber ?? 'Invoice'}.pdf`);
}

// ── PURCHASE ORDER ────────────────────────────────────────────────────────────

export function downloadPurchaseOrderPdf(po: any, company: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const meta = [
    { label: 'PO Number', value: po.poNumber ?? '—' },
    { label: 'PO Date', value: po.poDate ? dayjs(po.poDate).format('DD/MM/YYYY') : '—' },
    { label: 'Expected By', value: po.expectedDate ? dayjs(po.expectedDate).format('DD/MM/YYYY') : '—' },
    { label: 'Payment Terms', value: po.paymentTerms ?? '—' },
  ];

  let y = drawPageHeader(doc, company, 'PURCHASE ORDER', meta);

  y = drawPartyBox(doc, y,
    {
      heading: 'Supplier / Vendor',
      name: po.supplier?.name,
      gstin: po.supplier?.gstin,
      address: po.supplier?.address,
      city: po.supplier?.city,
      state: po.supplier?.state,
      pinCode: po.supplier?.pinCode,
      phone: po.supplier?.phone,
      email: po.supplier?.email,
    },
    po.deliveryAddress
      ? { heading: 'Delivery Address', name: company.name, address: po.deliveryAddress }
      : null,
  );

  y = drawItemsTable(doc, po.lineItems ?? [], y);
  y = drawTotals(doc, po, y + 5);

  if (po.notes) {
    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(...C.dark);
    doc.text('Special Instructions / Notes:', 10, y + 4);
    doc.setFont('helvetica', 'normal').setTextColor(...C.muted).setFontSize(7.5);
    const W = doc.internal.pageSize.getWidth();
    const lines = doc.splitTextToSize(po.notes, W - 20);
    doc.text(lines, 10, y + 9);
    y += 9 + lines.length * 4;
  }

  drawSignature(doc, company, y + 5);
  drawFooter(doc);

  doc.save(`${po.poNumber ?? 'PurchaseOrder'}.pdf`);
}

// ── DELIVERY CHALLAN ──────────────────────────────────────────────────────────

export function downloadChallanPdf(dc: any, company: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const meta = [
    { label: 'Challan No', value: dc.challanNumber ?? '—' },
    { label: 'Date', value: dc.challanDate ? dayjs(dc.challanDate).format('DD/MM/YYYY') : '—' },
    { label: 'Type', value: dc.challanType ?? '—' },
    { label: 'E-Way Bill', value: dc.eWayBillNumber ?? '—' },
  ];

  let y = drawPageHeader(doc, company, 'DELIVERY CHALLAN', meta);

  y = drawPartyBox(doc, y,
    {
      heading: 'Deliver To',
      name: dc.customer?.name,
      gstin: dc.customer?.gstin,
      address: dc.deliveryAddress ?? dc.customer?.address,
      phone: dc.customer?.phone,
      email: dc.customer?.email,
    },
    null,
  );

  const rows = (dc.lineItems ?? []).map((item: any, i: number) => [
    i + 1,
    item.description ?? '',
    item.quantity ?? '',
    item.unit ?? '—',
    item.remarks ?? '',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Description', 'Qty', 'Unit', 'Remarks']],
    body: rows,
    styles: { fontSize: 7.5 },
    headStyles: { fillColor: C.primary, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 249, 255] },
    columnStyles: { 0: { cellWidth: 8, halign: 'center' } },
    margin: { left: 10, right: 10 },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 6;

  if (dc.transportMode || dc.vehicleNumber || dc.lrNumber) {
    autoTable(doc, {
      startY: finalY,
      head: [['Transport Mode', 'Transporter', 'Vehicle No.', 'LR Number', 'Driver', 'Packages']],
      body: [[
        dc.transportMode ?? '—', dc.transporterName ?? '—', dc.vehicleNumber ?? '—',
        dc.lrNumber ?? '—', dc.driverName ?? '—', dc.numberOfPackages ?? '—',
      ]],
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: C.muted, textColor: 255 },
      margin: { left: 10, right: 10 },
    });
    finalY = (doc as any).lastAutoTable.finalY + 6;
  }

  const W = doc.internal.pageSize.getWidth();
  doc.setFontSize(7.5).setFont('helvetica', 'normal').setTextColor(...C.muted);
  doc.line(10, finalY + 18, 65, finalY + 18);
  doc.text('Receiver Signature & Stamp', 37, finalY + 22, { align: 'center' });
  drawSignature(doc, company, finalY);
  drawFooter(doc);

  doc.save(`${dc.challanNumber ?? 'DeliveryChallan'}.pdf`);
}
