import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

// ── colour palette ────────────────────────────────────────────────────────────
const C = {
  primary:   [15, 52, 96]  as [number,number,number],
  accent:    [0, 120, 212] as [number,number,number],
  light:     [230, 240, 252] as [number,number,number],
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

  doc.setFillColor(...C.primary);
  doc.rect(0, 0, W, 38, 'F');

  let logoEndX = W - 10;
  if (company.logoUrl && company.logoUrl.startsWith('data:image')) {
    try {
      doc.addImage(company.logoUrl, 'PNG', W - 44, 5, 34, 18);
      logoEndX = W - 46;
    } catch { /* ignore */ }
  }

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

  void logoEndX; // used for logo placement

  doc.setFillColor(...C.accent);
  doc.rect(0, 38, W, 9, 'F');
  doc.setTextColor(...C.white).setFontSize(11).setFont('helvetica', 'bold');
  doc.text(docTitle, W / 2, 44.5, { align: 'center' });

  doc.setFillColor(...C.light);
  doc.rect(0, 47, W, 12, 'F');
  doc.setTextColor(...C.dark).setFontSize(8).setFont('helvetica', 'normal');
  const colW = (W - 20) / docMeta.length;
  docMeta.forEach((m, i) => {
    const x = 10 + i * colW;
    doc.setFont('helvetica', 'bold').text(m.label + ':', x, 52);
    doc.setFont('helvetica', 'normal').text(m.value, x + 24, 52);
  });

  doc.setTextColor(...C.dark);
  return 62;
}

// ── customer / party details box ──────────────────────────────────────────────
// right.lines: array of strings rendered as extra info rows below name

function drawPartyBox(
  doc: jsPDF,
  startY: number,
  left: {
    heading: string; name: string; gstin?: string; address?: string;
    city?: string; state?: string; pinCode?: string; phone?: string; email?: string;
  },
  right?: {
    heading: string; name?: string; lines?: string[];
    address?: string; city?: string; state?: string; pinCode?: string;
  } | null,
) {
  const W = doc.internal.pageSize.getWidth();
  const boxH = 36;
  const midX = W / 2;

  // Left box
  doc.setFillColor(...C.light);
  doc.roundedRect(10, startY, midX - 14, boxH, 2, 2, 'F');
  doc.setDrawColor(...C.border);
  doc.roundedRect(10, startY, midX - 14, boxH, 2, 2, 'S');

  doc.setFillColor(...C.primary);
  doc.roundedRect(10, startY, midX - 14, 7, 2, 2, 'F');
  doc.rect(10, startY + 3.5, midX - 14, 3.5, 'F');
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

  // Right box (optional)
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
    if (right.name) {
      doc.setFont('helvetica', 'bold').setFontSize(8.5);
      doc.text(right.name, midX + 8, ry); ry += 5;
    }
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...C.muted);
    // Extra info lines (label: value format)
    if (right.lines) {
      for (const line of right.lines) {
        const wrapped = doc.splitTextToSize(line, midX - 24);
        doc.text(wrapped, midX + 8, ry);
        ry += wrapped.length * 4.2;
      }
    }
    const rAddr = [right.address, right.city, right.state, right.pinCode].filter(Boolean).join(', ');
    if (rAddr) { const w = doc.splitTextToSize(rAddr, midX - 24); doc.text(w, midX + 8, ry); }
  }

  doc.setTextColor(...C.dark);
  return startY + boxH + 5;
}

// ── info band (key-value row below party boxes) ───────────────────────────────

function drawInfoBand(doc: jsPDF, y: number, fields: { label: string; value: string }[]): number {
  if (!fields.length) return y;
  const W = doc.internal.pageSize.getWidth();
  const colW = (W - 20) / fields.length;
  doc.setFillColor(245, 249, 255);
  doc.rect(10, y, W - 20, 8, 'F');
  doc.setDrawColor(...C.border);
  doc.rect(10, y, W - 20, 8, 'S');
  fields.forEach((f, i) => {
    const x = 10 + i * colW + 3;
    doc.setFontSize(7.5).setFont('helvetica', 'bold').setTextColor(...C.muted);
    doc.text(f.label + ':', x, y + 5.2);
    doc.setFont('helvetica', 'normal').setTextColor(...C.dark);
    doc.text(f.value, x + doc.getTextWidth(f.label + ': ') + 1, y + 5.2);
  });
  return y + 12;
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
// Handles both `subTotal` (PurchaseOrder) and `amount` (Invoice / Quotation) naming

function drawTotals(doc: jsPDF, data: any, startY: number): number {
  const W = doc.internal.pageSize.getWidth();
  const col1X = 10;
  const col2X = W / 2 + 4;
  const rightEdge = W - 10;

  // normalise the pre-tax subtotal regardless of field name used by each backend module
  const subTotal = data.subTotal ?? data.amount ?? 0;

  const rows: [string, number][] = [
    ['Sub Total', subTotal],
    ...(data.discountTotal ? [['Discount (-)', -Math.abs(data.discountTotal)] as [string, number]] : []),
    ...(data.cgst  ? [['CGST',  data.cgst]  as [string, number]] : []),
    ...(data.sgst  ? [['SGST',  data.sgst]  as [string, number]] : []),
    ...(data.igst  ? [['IGST',  data.igst]  as [string, number]] : []),
  ];

  const totalAmt = data.totalAmount ?? 0;

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

  doc.setFillColor(...C.primary);
  doc.rect(boxX, ty - 1, boxW, 8, 'F');
  doc.setTextColor(...C.white).setFontSize(9).setFont('helvetica', 'bold');
  doc.text('Grand Total', boxX + 4, ty + 4.5);
  doc.text(rupee(totalAmt), rightEdge - 2, ty + 4.5, { align: 'right' });

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

// ── terms / notes block ───────────────────────────────────────────────────────

function drawTerms(doc: jsPDF, title: string, text: string | undefined | null, y: number, x2col = false): number {
  if (!text) return y;
  const W = doc.internal.pageSize.getWidth();
  const startX = x2col ? W / 2 + 4 : 10;
  const colW = x2col ? W / 2 - 14 : W - 20;

  doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(...C.dark);
  doc.text(title, startX, y);
  doc.setFont('helvetica', 'normal').setTextColor(...C.muted).setFontSize(7);
  const lines = doc.splitTextToSize(text, colW);
  doc.text(lines, startX, y + 5);
  return y + 5 + lines.length * 3.8 + 3;
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

  // quoteDate field does not exist on schema — fall back to createdAt
  const dateVal = q.createdAt ? dayjs(q.createdAt).format('DD/MM/YYYY') : '—';

  const meta = [
    { label: 'Quotation No',    value: q.quoteNumber ?? '—' },
    { label: 'Date',            value: dateVal },
    { label: 'Valid Until',     value: q.validUntil ? dayjs(q.validUntil).format('DD/MM/YYYY') : '—' },
    { label: 'Place of Supply', value: q.placeOfSupply ?? '—' },
  ];

  let y = drawPageHeader(doc, company, 'QUOTATION', meta);

  // Build right-box lines: subject + reference + delivery terms
  const rightLines: string[] = [];
  if (q.subject)       rightLines.push(`Subject: ${q.subject}`);
  if (q.reference)     rightLines.push(`Ref: ${q.reference}`);
  if (q.deliveryTerms) rightLines.push(`Delivery: ${q.deliveryTerms}`);
  if (q.deliveryPeriod) rightLines.push(`Period: ${q.deliveryPeriod}`);

  y = drawPartyBox(doc, y,
    {
      heading:  'Bill To',
      name:     q.customer?.name,
      gstin:    q.customer?.gstin,
      address:  q.customer?.billingAddress ?? q.customer?.address,
      city:     q.customer?.billingCity,
      state:    q.customer?.billingState,
      pinCode:  q.customer?.billingPinCode,
      phone:    q.customer?.phone,
      email:    q.customer?.email,
    },
    rightLines.length > 0 ? { heading: 'Details', lines: rightLines } : null,
  );

  // items field name is 'items' in Quotation, 'lineItems' in Invoice/PO
  const lineItems = q.items ?? q.lineItems ?? [];
  y = drawItemsTable(doc, lineItems, y);
  y = drawTotals(doc, q, y + 5);
  y = drawBankDetails(doc, company, y);

  // Terms & Conditions on right, notes on left (notes are internal so not shown)
  y = drawTerms(doc, 'Terms & Conditions:', q.termsConditions, y + 5);
  drawSignature(doc, company, y + 5);
  drawFooter(doc);

  doc.save(`${q.quoteNumber ?? 'Quotation'}.pdf`);
}

// ── INVOICE ───────────────────────────────────────────────────────────────────

export function downloadInvoicePdf(inv: any, company: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const meta = [
    { label: 'Invoice No',      value: inv.invoiceNumber ?? '—' },
    { label: 'Invoice Date',    value: inv.issueDate ? dayjs(inv.issueDate).format('DD/MM/YYYY') : dayjs(inv.createdAt).format('DD/MM/YYYY') },
    { label: 'Due Date',        value: inv.dueDate ? dayjs(inv.dueDate).format('DD/MM/YYYY') : '—' },
    { label: 'Payment Terms',   value: inv.paymentTerms ?? '—' },
    { label: 'Place of Supply', value: inv.placeOfSupply ?? '—' },
  ];

  let y = drawPageHeader(doc, company, 'TAX INVOICE', meta);

  // Customer PO reference as additional right-box line
  const rightLines: string[] = [];
  if (inv.customerPoNumber) rightLines.push(`PO Ref: ${inv.customerPoNumber}`);

  y = drawPartyBox(doc, y,
    {
      heading: 'Bill To',
      name:    inv.customer?.name,
      gstin:   inv.customer?.gstin,
      address: inv.customer?.billingAddress ?? inv.customer?.address,
      city:    inv.customer?.billingCity,
      state:   inv.customer?.billingState,
      pinCode: inv.customer?.billingPinCode,
      phone:   inv.customer?.phone,
      email:   inv.customer?.email,
    },
    rightLines.length > 0
      ? { heading: 'Customer PO Reference', lines: rightLines }
      : null,
  );

  y = drawItemsTable(doc, inv.lineItems ?? [], y);
  y = drawTotals(doc, inv, y + 5);
  y = drawBankDetails(doc, company, y);

  // Render both Terms & Conditions and Notes to Customer
  y = drawTerms(doc, 'Terms & Conditions:', inv.termsConditions, y + 5);
  y = drawTerms(doc, 'Notes to Customer:', inv.notes, y + 3);

  drawSignature(doc, company, y + 5);
  drawFooter(doc);

  doc.save(`${inv.invoiceNumber ?? 'Invoice'}.pdf`);
}

// ── PURCHASE ORDER ────────────────────────────────────────────────────────────

export function downloadPurchaseOrderPdf(po: any, company: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const meta = [
    { label: 'PO Number',     value: po.poNumber ?? '—' },
    { label: 'PO Date',       value: po.poDate ? dayjs(po.poDate).format('DD/MM/YYYY') : '—' },
    { label: 'Expected By',   value: po.expectedDate ? dayjs(po.expectedDate).format('DD/MM/YYYY') : '—' },
    { label: 'Payment Terms', value: po.paymentTerms ?? '—' },
    { label: 'Supplier Ref',  value: po.supplierRef ?? '—' },
  ];

  let y = drawPageHeader(doc, company, 'PURCHASE ORDER', meta);

  y = drawPartyBox(doc, y,
    {
      heading: 'Supplier / Vendor',
      name:    po.supplier?.name,
      gstin:   po.supplier?.gstin,
      address: po.supplier?.billingAddress ?? po.supplier?.address,
      city:    po.supplier?.billingCity ?? po.supplier?.city,
      state:   po.supplier?.billingState ?? po.supplier?.state,
      pinCode: po.supplier?.billingPinCode ?? po.supplier?.pinCode,
      phone:   po.supplier?.phone,
      email:   po.supplier?.email,
    },
    po.deliveryAddress
      ? { heading: 'Delivery Address', name: company.name, address: po.deliveryAddress }
      : null,
  );

  y = drawItemsTable(doc, po.lineItems ?? [], y);
  y = drawTotals(doc, po, y + 5);

  // Notes / special instructions
  y = drawTerms(doc, 'Terms & Conditions:', po.termsConditions, y + 4);
  y = drawTerms(doc, 'Special Instructions / Notes:', po.notes, y + 3);

  drawSignature(doc, company, y + 5);
  drawFooter(doc);

  doc.save(`${po.poNumber ?? 'PurchaseOrder'}.pdf`);
}

// ── DELIVERY CHALLAN ──────────────────────────────────────────────────────────

export function downloadChallanPdf(dc: any, company: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const meta = [
    { label: 'Challan No',       value: dc.challanNumber ?? '—' },
    { label: 'Date',             value: dc.challanDate ? dayjs(dc.challanDate).format('DD/MM/YYYY') : '—' },
    { label: 'Type',             value: dc.challanType ?? '—' },
    { label: 'Expected Delivery', value: dc.expectedDelivery ? dayjs(dc.expectedDelivery).format('DD/MM/YYYY') : '—' },
    { label: 'E-Way Bill',       value: dc.eWayBillNumber ?? '—' },
  ];

  let y = drawPageHeader(doc, company, 'DELIVERY CHALLAN', meta);

  // Show contact person on right if present
  const rightLines: string[] = [];
  if (dc.contactPerson) rightLines.push(`Contact: ${dc.contactPerson}`);

  y = drawPartyBox(doc, y,
    {
      heading: 'Deliver To',
      name:    dc.customer?.name,
      gstin:   dc.customer?.gstin,
      address: dc.deliveryAddress ?? dc.customer?.billingAddress ?? dc.customer?.address,
      city:    dc.customer?.billingCity,
      state:   dc.customer?.billingState,
      phone:   dc.customer?.phone,
      email:   dc.customer?.email,
    },
    rightLines.length > 0 ? { heading: 'Dispatch Info', lines: rightLines } : null,
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

  // Logistics table — include all transport fields
  const hasTransport = dc.transportMode || dc.vehicleNumber || dc.lrNumber || dc.transporterName;
  if (hasTransport) {
    // Two rows: headers + values, split into two for readability
    autoTable(doc, {
      startY: finalY,
      head: [['Transport Mode', 'Transporter', 'Vehicle No.', 'LR Number', 'LR Date', 'Driver', 'Driver Mobile', 'Packages', 'Weight (kg)']],
      body: [[
        dc.transportMode ?? '—',
        dc.transporterName ?? '—',
        dc.vehicleNumber ?? '—',
        dc.lrNumber ?? '—',
        dc.lrDate ? dayjs(dc.lrDate).format('DD/MM/YYYY') : '—',
        dc.driverName ?? '—',
        dc.driverMobile ?? '—',
        dc.numberOfPackages ?? '—',
        dc.weightKg != null ? `${dc.weightKg} kg` : '—',
      ]],
      styles: { fontSize: 6.5, cellPadding: 1.5 },
      headStyles: { fillColor: C.muted, textColor: 255, fontSize: 6.5 },
      margin: { left: 10, right: 10 },
    });
    finalY = (doc as any).lastAutoTable.finalY + 6;
  }

  // Remarks section
  if (dc.remarks) {
    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(...C.dark);
    doc.text('Remarks:', 10, finalY);
    doc.setFont('helvetica', 'normal').setTextColor(...C.muted).setFontSize(7.5);
    const W = doc.internal.pageSize.getWidth();
    const lines = doc.splitTextToSize(dc.remarks, W - 20);
    doc.text(lines, 10, finalY + 5);
    finalY += 5 + lines.length * 4 + 4;
  }

  // Info band: dispatch date + status
  if (dc.dispatchDate || dc.status) {
    finalY = drawInfoBand(doc, finalY, [
      ...(dc.dispatchDate ? [{ label: 'Dispatch Date', value: dayjs(dc.dispatchDate).format('DD/MM/YYYY') }] : []),
      ...(dc.status ? [{ label: 'Status', value: dc.status }] : []),
    ]);
  }

  const W = doc.internal.pageSize.getWidth();
  doc.setFontSize(7.5).setFont('helvetica', 'normal').setTextColor(...C.muted);
  doc.line(10, finalY + 18, 65, finalY + 18);
  doc.text('Receiver Signature & Stamp', 37, finalY + 22, { align: 'center' });
  drawSignature(doc, company, finalY);
  drawFooter(doc);

  doc.save(`${dc.challanNumber ?? 'DeliveryChallan'}.pdf`);
}
