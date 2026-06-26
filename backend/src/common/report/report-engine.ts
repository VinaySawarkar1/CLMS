/**
 * CLMS Report Engine — NABL ISO/IEC 17025 Certificate Renderer
 * Produces self-contained HTML matching the structure of real NABL calibration certificates.
 */

export interface ReportObservation {
  pointLabel?: string | null;
  unit?: string | null;
  nominal?: number | null;
  standardValue?: number | null;
  observedValue?: number | null;
  correction?: number | null;
  error?: number | null;
  passFail?: 'pass' | 'fail' | null;
  mpeLimit?: string | null;
}

export type CertificateTemplate = 'nabl' | 'iso17025' | 'compact' | 'traceability' | 'customer-branded';

export interface ReferenceStandardInfo {
  name: string;
  idNumber?: string | null;
  srNo?: string | null;
  make?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  certificateNumber?: string | null;
  calibrationDate?: Date | null;
  validUpTo?: Date | null;
  traceability?: string | null;
  uncertainty?: string | null;
}

export interface CertificateReportData {
  // Header
  certificateNumber: string;
  ulrNumber?: string | null;         // Unique Lab Reference (NABL ULR No.)
  type: string;
  issueDate: Date;
  pageNumber?: number;
  totalPages?: number;

  // Lab info
  labName?: string | null;
  labAddress?: string | null;
  labPhone?: string | null;
  labEmail?: string | null;
  labWebsite?: string | null;
  labAccreditation?: string | null;  // NABL CC No.
  labLogoUrl?: string | null;        // base64 data URL or https URL
  labSignatoryName?: string | null;
  labSignatoryDesignation?: string | null;

  // Customer
  customerName: string;
  customerAddress?: string | null;
  throughAgent?: string | null;      // "Through: M/s. Reckonix, Pune"

  // Job admin
  jobNumber: string;
  dateOfReceipt?: Date | null;
  calibrationDate?: Date | null;
  nextCalibrationDate?: Date | null;
  challanNo?: string | null;
  poNumber?: string | null;
  conditionOfItem?: string | null;

  // Instrument Under Test
  instrumentName: string;
  instrumentMake?: string | null;
  instrumentModel?: string | null;
  instrumentSerial?: string | null;
  instrumentRange?: string | null;
  instrumentLeastCount?: string | null;
  instrumentIdNumber?: string | null;
  labIdNo?: string | null;
  calibrationLocation?: string | null;  // "In Lab" or "Onsite"

  // Procedure
  calibrationProcedureNo?: string | null;
  referenceDocumentNo?: string | null;
  calibrationProcedure?: string | null;

  // NABL discipline scope line
  nablDiscipline?: string | null;   // e.g. "NABL 120 2.3.4 Mechanical Discipline: Dimensions"

  // Environment
  environmental?: {
    temperature?: number;
    temperatureTolerance?: number;
    humidity?: number;
    humidityTolerance?: number;
    pressure?: number;
  } | null;

  // Results
  observations: ReportObservation[];
  repeatability?: string | null;
  accuracy?: string | null;
  resultRemarks?: string | null;

  // Uncertainty
  expandedUncertainty?: number | null;
  uncertaintyUnit?: string | null;
  coverageFactor?: number | null;
  decisionRule?: string | null;

  // Reference Standards
  referenceStandards?: ReferenceStandardInfo[];

  // QR & signatures
  qrVerificationUrl?: string | null;
  qrDataUrl?: string | null;
  signatures?: Array<{ stage: string; by: string; designation?: string }>;

  // Template / display options
  template?: CertificateTemplate | null;
  mpeLimit?: string | null;        // e.g. "±0.5%" — shown in results table header
  showPassFail?: boolean;          // default true when any observation has passFail set
}

// ── helpers ──────────────────────────────────────────────────────

function esc(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function num(v: number | null | undefined, d = 4): string {
  return v === null || v === undefined ? '—' : v.toFixed(d);
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function cell(label: string, value: string, bold = false): string {
  return `<td class="lbl">${esc(label)}</td><td class="val">${bold ? `<b>${value}</b>` : value}</td>`;
}

// ── sub-renderers ─────────────────────────────────────────────────

function renderObservations(rows: ReportObservation[], showPassFail = false): string {
  if (!rows.length) {
    return `<tr><td colspan="${showPassFail ? 9 : 7}" style="text-align:center;color:#888;padding:12px">No observations recorded</td></tr>`;
  }
  return rows.map((o) => {
    const pf = o.passFail;
    const pfCell = showPassFail
      ? `<td style="font-weight:bold;color:${pf === 'pass' ? '#237804' : pf === 'fail' ? '#cf1322' : '#888'}">${pf === 'pass' ? '✓ PASS' : pf === 'fail' ? '✗ FAIL' : '—'}</td>`
      : '';
    const mpeCell = showPassFail ? `<td style="font-size:10px">${esc(o.mpeLimit)}</td>` : '';
    return `<tr>
    <td>${esc(o.pointLabel)}</td>
    <td>${esc(o.unit)}</td>
    <td>${num(o.nominal)}</td>
    <td>${num(o.standardValue)}</td>
    <td>${num(o.observedValue)}</td>
    <td>${num(o.correction)}</td>
    <td>${num(o.error)}</td>
    ${mpeCell}${pfCell}
  </tr>`;
  }).join('');
}

function renderReferenceStandards(refs: ReferenceStandardInfo[]): string {
  if (!refs.length) return '';
  return `
  <div class="section">
    <div class="section-title">Equipment &amp; Master Used for Calibration</div>
    <p style="font-size:11px;margin:0 0 6px;color:#333">
      Used Standards are traceable to National / International Standards (Direct / through NABL Accredited Lab.)
    </p>
    <table class="data">
      <thead><tr>
        <th>Equipment / Description</th>
        <th>Identification No.</th>
        <th>Sr. No.</th>
        <th>Calibration Cert. No.</th>
        <th>Calibration Date</th>
        <th>Valid Up To</th>
        <th>Traceability With</th>
      </tr></thead>
      <tbody>
        ${refs.map((r) => `<tr>
          <td style="text-align:left">${esc(r.name)}</td>
          <td>${esc(r.idNumber)}</td>
          <td>${esc(r.srNo || r.serialNumber)}</td>
          <td>${esc(r.certificateNumber)}</td>
          <td>${fmtDate(r.calibrationDate)}</td>
          <td>${fmtDate(r.validUpTo)}</td>
          <td style="text-align:left;font-size:11px">${esc(r.traceability)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

// ── main render ───────────────────────────────────────────────────

export function renderCertificateHtml(d: CertificateReportData): string {
  const template = d.template ?? 'nabl';
  if (template === 'compact') return renderCompactHtml(d);
  if (template === 'traceability') return renderTraceabilityHtml(d);
  if (template === 'customer-branded') return renderCustomerBrandedHtml(d);
  // 'nabl' and 'iso17025' use the same full layout (iso17025 tweaks header text)
  return renderNablHtml(d, template === 'iso17025');
}

function renderNablHtml(d: CertificateReportData, iso = false): string {
  const env = d.environmental ?? {};
  const unit = d.uncertaintyUnit ?? d.observations[0]?.unit ?? '';
  const pageNum = d.pageNumber ?? 1;
  const totalPages = d.totalPages ?? 1;
  const calibrationLocation = d.calibrationLocation ?? 'In Lab';
  const ulr = d.ulrNumber ?? '';
  const hasPassFail = d.showPassFail ?? d.observations.some((o) => o.passFail != null);

  const tempStr = env.temperature !== undefined
    ? `${num(env.temperature, 1)} °C (±${env.temperatureTolerance ?? 1} °C)`
    : '--';
  const humStr = env.humidity !== undefined
    ? `${num(env.humidity, 1)} % RH (±${env.humidityTolerance ?? 10} % RH)`
    : '--';

  return `<!doctype html>
<html><head>
<meta charset="utf-8"/>
<title>${iso ? 'ISO/IEC 17025 ' : ''}Certificate of Calibration — ${esc(d.certificateNumber)}</title>
<style>
  @page { size: A4; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; margin: 0; }
  .page { max-width: 780px; margin: 0 auto; padding: 16px; }

  /* ── Top header ── */
  .top-header { display: flex; justify-content: space-between; align-items: center;
    border-bottom: 3px double #1565c0; padding-bottom: 10px; margin-bottom: 4px; }
  .lab-info { flex: 1; }
  .cert-heading { text-align: center; flex: 2; }
  .cert-heading h1 { font-size: 17px; font-weight: bold; color: #1a237e; margin: 0; letter-spacing: 1px; }
  .cert-heading h2 { font-size: 13px; font-weight: normal; color: #333; margin: 3px 0 0; }
  .cert-heading .issued-by { font-size: 10px; color: #555; margin: 0; }
  .lab-name-big { font-size: 14px; font-weight: bold; color: #1a237e; }
  .lab-addr { font-size: 10px; color: #444; margin-top: 2px; }
  .nabl-badge { text-align: right; font-size: 10px; color: #555; }
  .nabl-badge .cc { font-weight: bold; font-size: 12px; color: #1a237e; }

  /* ── Meta row (certificate no., dates, page) ── */
  .meta-strip { background: #e8eaf6; border: 1px solid #9fa8da; margin-top: 6px; }
  .meta-strip table { width: 100%; border-collapse: collapse; }
  .meta-strip td { padding: 4px 8px; font-size: 11px; border-right: 1px solid #c5cae9; }
  .meta-strip td:last-child { border-right: none; }
  .meta-strip .hdr { font-weight: bold; color: #283593; font-size: 10px; border-bottom: 1px solid #9fa8da; }

  /* ── Section tables ── */
  .info-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .info-table td { padding: 3px 6px; font-size: 11.5px; border: 1px solid #cfd8dc; vertical-align: top; }
  .lbl { color: #37474f; background: #f5f5f5; font-weight: normal; width: 160px; white-space: nowrap; }
  .val { color: #1a1a1a; }

  /* ── Boxed section ── */
  .section { margin-top: 10px; }
  .section-title { font-weight: bold; font-size: 11px; color: #1a237e; background: #e8eaf6;
    border: 1px solid #9fa8da; padding: 3px 8px; text-transform: uppercase; letter-spacing: 0.4px; }

  /* ── Calibration results table ── */
  table.data { border-collapse: collapse; width: 100%; margin-top: 0; font-size: 11px; }
  table.data th { background: #bbdefb; border: 1px solid #64b5f6; padding: 5px 6px; font-size: 10.5px;
    text-align: center; font-weight: bold; color: #0d47a1; }
  table.data td { border: 1px solid #b0bec5; padding: 4px 6px; text-align: center; }
  table.data tr:nth-child(even) { background: #f8fbff; }
  .discipline-line { font-size: 11px; font-weight: bold; color: #283593; background: #ede7f6;
    border: 1px solid #b39ddb; padding: 4px 8px; margin-bottom: 0; }

  /* ── Uncertainty ── */
  .unc-box { border: 1px solid #43a047; background: #e8f5e9; padding: 8px 12px; margin-top: 8px; }
  .unc-main { font-size: 13px; font-weight: bold; color: #1b5e20; }
  .unc-note { font-size: 10.5px; color: #2e7d32; margin-top: 3px; }

  /* ── Decision rule ── */
  .decision-box { border: 1px solid #f57c00; background: #fff3e0; padding: 6px 10px; margin-top: 6px; font-size: 11px; }

  /* ── Signatures ── */
  .sign-row { display: flex; justify-content: space-between; margin-top: 28px; gap: 20px; }
  .sign-block { flex: 1; border-top: 1px solid #333; padding-top: 6px; text-align: center; }
  .sign-name { font-weight: bold; font-size: 12px; }
  .sign-desig { font-size: 10.5px; color: #555; }

  /* ── Footer ── */
  .footer-qr { display: flex; justify-content: space-between; align-items: flex-end;
    margin-top: 16px; border-top: 1px solid #999; padding-top: 10px; }
  .legal-notes { font-size: 10px; color: #444; flex: 1; }
  .legal-notes li { margin-bottom: 2px; }
  .qr-block { text-align: center; margin-left: 16px; flex-shrink: 0; }
  .qr-block img { width: 90px; height: 90px; border: 1px solid #ccc; padding: 2px; }
  .qr-label { font-size: 9px; color: #666; margin-top: 2px; }

  .end-cert { text-align: center; font-weight: bold; color: #555; margin: 16px 0 8px;
    font-size: 12px; letter-spacing: 2px; }
  .page-footer-bar { display: flex; justify-content: space-between; font-size: 9px; color: #888;
    border-top: 1px dotted #ccc; margin-top: 4px; padding-top: 3px; }

  @media print { .page { padding: 0; } }
</style>
</head>
<body>
<div class="page">

<!-- ══ HEADER ══════════════════════════════════════════════════════ -->
<div class="top-header">
  <div class="lab-info">
    ${d.labLogoUrl ? `<img src="${d.labLogoUrl}" alt="Lab Logo" style="max-height:60px;max-width:180px;object-fit:contain;display:block;margin-bottom:6px;"/>` : ''}
    <div class="lab-name-big">${esc(d.labName || 'Calibration Laboratory')}</div>
    ${d.labAddress ? `<div class="lab-addr">${esc(d.labAddress)}</div>` : ''}
    ${(d.labPhone || d.labEmail) ? `<div class="lab-addr">${d.labPhone ? 'Tel: ' + esc(d.labPhone) : ''}${d.labPhone && d.labEmail ? ' &nbsp;|&nbsp; ' : ''}${d.labEmail ? 'E-Mail: ' + esc(d.labEmail) : ''}</div>` : ''}
    ${d.labWebsite ? `<div class="lab-addr">Web: ${esc(d.labWebsite)}</div>` : ''}
  </div>
  <div class="cert-heading">
    <h1>${iso ? 'ISO/IEC 17025 CALIBRATION REPORT' : 'CERTIFICATE OF CALIBRATION'}</h1>
    <h2>ISSUED BY &nbsp;${esc(d.labName || 'Calibration Laboratory')}</h2>
    <div class="issued-by">ISO / IEC 17025 · ${esc(d.type)}</div>
  </div>
  <div class="nabl-badge">
    ${d.labAccreditation ? `<div>NABL Accredited</div><div class="cc">${esc(d.labAccreditation)}</div>` : ''}
  </div>
</div>

<!-- ══ CERT META STRIP ════════════════════════════════════════════ -->
<div class="meta-strip">
  <table>
    <tr>
      <td class="hdr">Certificate No.</td>
      <td class="hdr">Date of Receipt</td>
      <td class="hdr">Date of Calibration</td>
      <td class="hdr">Next Date of Calibration</td>
      ${ulr ? `<td class="hdr">ULR No.</td>` : ''}
      <td class="hdr">Page</td>
      <td class="hdr">No. of Pages</td>
    </tr>
    <tr>
      <td><b>${esc(d.certificateNumber)}</b></td>
      <td>${fmtDate(d.dateOfReceipt)}</td>
      <td><b>${fmtDate(d.calibrationDate || d.issueDate)}</b></td>
      <td>${fmtDate(d.nextCalibrationDate)}</td>
      ${ulr ? `<td style="font-size:10px">${esc(ulr)}</td>` : ''}
      <td style="text-align:center">${pageNum}</td>
      <td style="text-align:center">${totalPages}</td>
    </tr>
  </table>
</div>

<!-- ══ CUSTOMER ════════════════════════════════════════════════════ -->
<table class="info-table" style="margin-top:6px">
  <tr>
    <td class="lbl">Name of Customer &amp; Address</td>
    <td class="val">
      <b>${esc(d.customerName)}</b>
      ${d.customerAddress ? `<br/>${esc(d.customerAddress)}` : ''}
      ${d.throughAgent ? `<br/><i style="color:#555">(Through — ${esc(d.throughAgent)})</i>` : ''}
    </td>
  </tr>
</table>

<!-- ══ ADMIN ROW (PO / Challan / Work Order / Condition) ══════════ -->
<table class="info-table">
  <tr>
    <td class="lbl" style="width:120px">Purchase Order No.</td><td class="val" style="width:120px">${esc(d.poNumber) || 'Nil'}</td>
    <td class="lbl" style="width:100px">Challan No.</td><td class="val" style="width:120px">${esc(d.challanNo) || 'Nil'}</td>
    <td class="lbl" style="width:120px">Work Order No.</td><td class="val" style="width:140px">${esc(d.jobNumber)}</td>
    <td class="lbl" style="width:120px">Condition of Item</td><td class="val">${esc(d.conditionOfItem) || 'OK (As Received)'}</td>
  </tr>
</table>

<!-- ══ UNIT UNDER CALIBRATION ════════════════════════════════════ -->
<div class="section">
  <div class="section-title">Unit Under Calibration (Gauge for Calibration)</div>
  <table class="info-table">
    <tr>
      <td class="lbl">Description</td><td class="val" colspan="3"><b>${esc(d.instrumentName)}</b></td>
    </tr>
    <tr>
      <td class="lbl">Make</td><td class="val">${esc(d.instrumentMake) || '—'}</td>
      <td class="lbl">Model</td><td class="val">${esc(d.instrumentModel) || '—'}</td>
    </tr>
    <tr>
      <td class="lbl">Range / L.C.</td>
      <td class="val">${esc(d.instrumentRange) || '—'}${d.instrumentLeastCount ? ' / ' + esc(d.instrumentLeastCount) : ''}</td>
      <td class="lbl">Sr. No.</td><td class="val">${esc(d.instrumentSerial) || '—'}</td>
    </tr>
    <tr>
      <td class="lbl">Identification No.</td><td class="val">${esc(d.instrumentIdNumber) || '—'}</td>
      <td class="lbl">Lab ID No.</td><td class="val">${esc(d.labIdNo) || '—'}</td>
    </tr>
    <tr>
      <td class="lbl">Calibration Location</td><td class="val">${esc(calibrationLocation)}</td>
      <td class="lbl">Environmental Conditions</td>
      <td class="val">Temperature: ${tempStr} &nbsp;&nbsp; Humidity: ${humStr}</td>
    </tr>
    ${d.calibrationProcedureNo ? `<tr><td class="lbl">Calibration Procedure No.</td><td class="val">${esc(d.calibrationProcedureNo)}</td>
      <td class="lbl">Reference Document No.</td><td class="val">${esc(d.referenceDocumentNo) || '—'}</td></tr>` : ''}
    ${d.calibrationProcedure ? `<tr><td class="lbl">Calibration Procedure</td><td class="val" colspan="3" style="font-size:11px">${esc(d.calibrationProcedure)}</td></tr>` : ''}
  </table>
</div>

<!-- ══ REFERENCE STANDARDS ════════════════════════════════════════ -->
${renderReferenceStandards(d.referenceStandards ?? [])}

<!-- ══ UNCERTAINTY ════════════════════════════════════════════════ -->
<div class="unc-box">
  <div class="unc-main">UNCERTAINTY OF MEASUREMENT &nbsp;: &nbsp;± ${num(d.expandedUncertainty, 4)} ${esc(unit)}</div>
  <div class="unc-note">
    The uncertainty stated is the expanded uncertainty of measurement obtained by multiplying the standard
    uncertainty by the coverage factor k = ${num(d.coverageFactor, 2)}, which corresponds to a confidence level of
    approximately 95.45%. &nbsp;NOTE: Calibration results are given on Page 2 onwards.
  </div>
</div>

${d.decisionRule ? `<div class="decision-box"><b>Decision Rule (ILAC-G8):</b> ${esc(d.decisionRule)}</div>` : ''}

<!-- ══ CALIBRATION RESULTS ════════════════════════════════════════ -->
<div class="section" style="margin-top:10px">
  ${d.nablDiscipline ? `<div class="discipline-line">${esc(d.nablDiscipline)}</div>` : ''}
  <div class="section-title">Calibration Results</div>
  <table class="data">
    <thead><tr>
      <th>Cal. Point / Reading</th>
      <th>Unit</th>
      <th>Nominal Value</th>
      <th>Standard Value</th>
      <th>Observed Value</th>
      <th>Correction</th>
      <th>Error</th>
      ${hasPassFail ? `<th>MPE Limit</th><th>Result</th>` : ''}
    </tr></thead>
    <tbody>${renderObservations(d.observations, hasPassFail)}</tbody>
  </table>

  ${d.repeatability ? `<div style="font-size:11px;margin-top:4px"><b>Repeatability:</b> ${esc(d.repeatability)}</div>` : ''}
  ${d.accuracy ? `<div style="font-size:11px;margin-top:2px"><b>Accuracy:</b> ${esc(d.accuracy)}</div>` : ''}
  ${d.resultRemarks ? `<div style="font-size:11px;margin-top:2px"><b>Remark:</b> ${esc(d.resultRemarks)}</div>` : ''}
</div>

<!-- ══ END OF CERTIFICATE ═════════════════════════════════════════ -->
<div class="end-cert">*&nbsp;*&nbsp;*&nbsp;&nbsp; End of Certificate &nbsp;&nbsp;*&nbsp;*&nbsp;*</div>

<!-- ══ SIGNATURES ════════════════════════════════════════════════ -->
<div class="sign-row">
  ${(d.signatures ?? []).map((s) => `
  <div class="sign-block">
    <div style="height:36px"></div>
    <div class="sign-name">${esc(s.by)}</div>
    <div class="sign-desig">${esc(s.designation || s.stage)}</div>
  </div>`).join('')}
  ${!(d.signatures ?? []).length ? `
  <div class="sign-block">
    <div style="height:36px"></div>
    <div class="sign-name">Calibrated By</div>
    <div class="sign-desig">Calibration Engineer</div>
  </div>
  <div class="sign-block">
    <div style="height:36px"></div>
    <div class="sign-name">${esc(d.labSignatoryName || 'Authorized Signatory')}</div>
    <div class="sign-desig">${esc(d.labSignatoryDesignation || 'Technical Manager')}</div>
  </div>` : ''}
</div>

<!-- ══ FOOTER (LEGAL NOTES + QR) ════════════════════════════════ -->
<div class="footer-qr">
  <ol class="legal-notes">
    <li>This certificate refers only to the particular item(s) submitted for calibration.</li>
    <li>This certificate shall not be reproduced except in full, without written permission of ${esc(d.labName || 'the laboratory')}.</li>
    <li>The calibration results reported in this certificate are valid at the time of and under the stated conditions of measurement.</li>
    ${d.qrVerificationUrl ? `<li>Verify authenticity online: <code style="font-size:9px">${esc(d.qrVerificationUrl)}</code></li>` : ''}
  </ol>
  ${d.qrDataUrl ? `
  <div class="qr-block">
    <img src="${d.qrDataUrl}" alt="Scan to verify"/>
    <div class="qr-label">Scan to Verify</div>
  </div>` : ''}
</div>

<div class="page-footer-bar">
  <span>Certificate No.: ${esc(d.certificateNumber)}</span>
  <span>REV. NO.: 00 &nbsp;&nbsp; ISSUE DT.: ${fmtDate(d.issueDate)}</span>
  <span>Page ${pageNum} of ${totalPages}</span>
</div>

</div><!-- /.page -->
</body></html>`;
}

// ── Compact template ──────────────────────────────────────────────────────────
function renderCompactHtml(d: CertificateReportData): string {
  const unit = d.uncertaintyUnit ?? d.observations[0]?.unit ?? '';
  const hasPassFail = d.observations.some((o) => o.passFail != null);
  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>Calibration Cert — ${esc(d.certificateNumber)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; margin: 10mm 12mm; }
  h2 { font-size: 14px; color: #1a237e; margin: 0 0 4px; text-align:center; }
  .sub { text-align:center; font-size:10px; color:#555; margin-bottom:8px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:4px 16px; margin-bottom:8px; font-size:11px; }
  .lbl { color:#666; font-size:10px; }
  table { width:100%; border-collapse:collapse; font-size:10.5px; }
  th { background:#e3f2fd; border:1px solid #90caf9; padding:3px 5px; }
  td { border:1px solid #cfd8dc; padding:3px 5px; text-align:center; }
  .pass { color:#237804; font-weight:bold; } .fail { color:#cf1322; font-weight:bold; }
  .unc { margin-top:6px; font-size:11px; border:1px solid #43a047; background:#e8f5e9; padding:4px 8px; }
  .foot { margin-top:8px; font-size:9px; color:#666; border-top:1px solid #ccc; padding-top:4px; }
</style></head><body>
${d.labLogoUrl ? `<div style="text-align:center;margin-bottom:6px"><img src="${d.labLogoUrl}" alt="Logo" style="max-height:48px;max-width:160px;object-fit:contain"/></div>` : ''}
<h2>${esc(d.labName || 'Calibration Laboratory')}</h2>
<div class="sub">CERTIFICATE OF CALIBRATION &nbsp;|&nbsp; ${esc(d.certificateNumber)} &nbsp;|&nbsp; ${new Date(d.issueDate).toLocaleDateString('en-IN')}</div>
<div class="grid">
  <div><span class="lbl">Customer:</span> ${esc(d.customerName)}</div>
  <div><span class="lbl">Job No.:</span> ${esc(d.jobNumber)}</div>
  <div><span class="lbl">Instrument:</span> ${esc(d.instrumentName)}</div>
  <div><span class="lbl">Serial No.:</span> ${esc(d.instrumentSerial) || '—'}</div>
  <div><span class="lbl">Make / Model:</span> ${esc(d.instrumentMake) || '—'} / ${esc(d.instrumentModel) || '—'}</div>
  <div><span class="lbl">Range:</span> ${esc(d.instrumentRange) || '—'}</div>
</div>
<table><thead><tr><th>Point</th><th>Unit</th><th>Nominal</th><th>Standard</th><th>Observed</th><th>Error</th>${hasPassFail ? '<th>MPE</th><th>Result</th>' : ''}</tr></thead>
<tbody>${d.observations.map((o) => {
  const pf = o.passFail;
  return `<tr><td>${esc(o.pointLabel)}</td><td>${esc(o.unit)}</td><td>${o.nominal ?? '—'}</td><td>${o.standardValue?.toFixed(4) ?? '—'}</td><td>${o.observedValue?.toFixed(4) ?? '—'}</td><td>${o.error?.toFixed(4) ?? '—'}</td>${hasPassFail ? `<td>${esc(o.mpeLimit)}</td><td class="${pf ?? ''}">${pf === 'pass' ? '✓ PASS' : pf === 'fail' ? '✗ FAIL' : '—'}</td>` : ''}</tr>`;
}).join('')}</tbody></table>
<div class="unc">Expanded Uncertainty: <b>± ${d.expandedUncertainty?.toFixed(4) ?? '—'} ${esc(unit)}</b> &nbsp; (k=${d.coverageFactor?.toFixed(2) ?? 2}, ~95%)</div>
<div class="foot">
  ${(d.signatures ?? []).map((s) => `${esc(s.by)} (${esc(s.stage)})`).join(' &nbsp;|&nbsp; ')}<br/>
  This certificate refers only to the item calibrated. Not valid if reproduced in part.
</div>
</body></html>`;
}

// ── Traceability Statement template ──────────────────────────────────────────
function renderTraceabilityHtml(d: CertificateReportData): string {
  const refs = d.referenceStandards ?? [];
  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>Traceability Statement — ${esc(d.certificateNumber)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 15mm 18mm; }
  h1 { font-size:16px; color:#1a237e; text-align:center; margin:0 0 4px; }
  h3 { font-size:13px; color:#283593; margin:14px 0 4px; border-bottom:1px solid #9fa8da; padding-bottom:2px; }
  .sub { text-align:center; font-size:11px; color:#555; margin-bottom:16px; }
  table { width:100%; border-collapse:collapse; font-size:11px; margin-top:4px; }
  th { background:#e8eaf6; border:1px solid #9fa8da; padding:4px 6px; }
  td { border:1px solid #cfd8dc; padding:4px 6px; }
  .note { font-size:10px; color:#555; margin-top:8px; }
  .sign-row { display:flex; justify-content:space-between; margin-top:40px; gap:20px; }
  .sign-block { flex:1; border-top:1px solid #333; padding-top:4px; text-align:center; font-size:11px; }
</style></head><body>
<h1>${esc(d.labName || 'Calibration Laboratory')}</h1>
<div class="sub">METROLOGICAL TRACEABILITY STATEMENT &nbsp;|&nbsp; Cert. No.: ${esc(d.certificateNumber)}</div>
<h3>Calibrated Item</h3>
<table><tbody>
  <tr><td><b>Description</b></td><td>${esc(d.instrumentName)}</td><td><b>Make / Model</b></td><td>${esc(d.instrumentMake) || '—'} / ${esc(d.instrumentModel) || '—'}</td></tr>
  <tr><td><b>Serial No.</b></td><td>${esc(d.instrumentSerial) || '—'}</td><td><b>Range</b></td><td>${esc(d.instrumentRange) || '—'}</td></tr>
  <tr><td><b>Customer</b></td><td>${esc(d.customerName)}</td><td><b>Calibration Date</b></td><td>${fmtDate(d.calibrationDate || d.issueDate)}</td></tr>
</tbody></table>
<h3>Traceability Chain — Reference Standards Used</h3>
${refs.length ? `<table><thead><tr><th>Standard</th><th>ID No.</th><th>Cert. No.</th><th>Cal. Date</th><th>Valid Up To</th><th>Traceability</th></tr></thead><tbody>
${refs.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.idNumber)}</td><td>${esc(r.certificateNumber)}</td><td>${fmtDate(r.calibrationDate)}</td><td>${fmtDate(r.validUpTo)}</td><td style="font-size:10px">${esc(r.traceability)}</td></tr>`).join('')}
</tbody></table>` : '<p style="color:#888">No reference standards recorded.</p>'}
<p class="note">All reference standards are calibrated by NABL accredited laboratories or National Measurement Institutes, establishing an unbroken chain of traceability to SI units as per ISO/IEC 17025:2017 clause 6.5.</p>
<h3>Uncertainty of Measurement</h3>
<p>Expanded Uncertainty: <b>± ${d.expandedUncertainty?.toFixed(4) ?? '—'} ${esc(d.uncertaintyUnit ?? '')}</b> &nbsp; (Coverage factor k = ${d.coverageFactor?.toFixed(2) ?? 2}, confidence level ~95.45%, normal distribution)</p>
<div class="sign-row">
  ${(d.signatures ?? []).map((s) => `<div class="sign-block"><b>${esc(s.by)}</b><br/>${esc(s.designation || s.stage)}</div>`).join('')}
  ${!(d.signatures ?? []).length ? '<div class="sign-block"><b>Calibrated By</b><br/>Calibration Engineer</div><div class="sign-block"><b>Authorized Signatory</b><br/>Technical Manager</div>' : ''}
</div>
</body></html>`;
}

// ── Customer-Branded template ─────────────────────────────────────────────────
function renderCustomerBrandedHtml(d: CertificateReportData): string {
  const unit = d.uncertaintyUnit ?? d.observations[0]?.unit ?? '';
  const hasPassFail = d.observations.some((o) => o.passFail != null);
  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>Calibration Certificate — ${esc(d.certificateNumber)}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size:12px; background:#fff; margin:0; padding:0; }
  .header { background: linear-gradient(135deg,#1a237e,#283593); color:#fff; padding:20px 28px; display:flex; justify-content:space-between; align-items:center; }
  .header h1 { margin:0; font-size:18px; letter-spacing:1px; }
  .header .cert-no { font-size:11px; opacity:0.8; }
  .body { padding:20px 28px; }
  .customer-banner { background:#e8eaf6; border-left:5px solid #1a237e; padding:10px 14px; margin-bottom:14px; font-size:13px; }
  .customer-banner .name { font-size:16px; font-weight:bold; color:#1a237e; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px 16px; margin-bottom:14px; }
  .field { font-size:11px; }
  .field .label { color:#888; font-size:10px; text-transform:uppercase; letter-spacing:0.4px; }
  .field .value { font-weight:600; color:#111; }
  table { width:100%; border-collapse:collapse; font-size:11px; }
  th { background:#283593; color:#fff; border:1px solid #1a237e; padding:5px 7px; font-size:10.5px; }
  td { border:1px solid #cfd8dc; padding:4px 6px; text-align:center; }
  tr:nth-child(even) td { background:#f5f5f5; }
  .pass { color:#237804; font-weight:bold; } .fail { color:#cf1322; font-weight:bold; }
  .unc-bar { background:#e8f5e9; border:1px solid #43a047; padding:8px 14px; margin:12px 0; font-size:12px; }
  .footer { background:#f5f5f5; border-top:1px solid #ddd; padding:12px 28px; font-size:10px; color:#666; display:flex; justify-content:space-between; }
</style></head><body>
<div class="header">
  <div style="display:flex;align-items:center;gap:14px">
    ${d.labLogoUrl ? `<img src="${d.labLogoUrl}" alt="Logo" style="max-height:52px;max-width:140px;object-fit:contain;filter:brightness(0) invert(1);opacity:0.9"/>` : ''}
    <div>
      <h1>${esc(d.labName || 'Calibration Laboratory')}</h1>
      <div class="cert-no">Cert. No.: ${esc(d.certificateNumber)} &nbsp;|&nbsp; Date: ${new Date(d.issueDate).toLocaleDateString('en-IN')}</div>
      ${d.labAccreditation ? `<div class="cert-no">NABL Accredited — ${esc(d.labAccreditation)}</div>` : ''}
    </div>
  </div>
  <div style="text-align:right; opacity:0.9; font-size:12px"><b>CERTIFICATE OF CALIBRATION</b><br/>ISO/IEC 17025:2017</div>
</div>
<div class="body">
  <div class="customer-banner">
    <div class="name">${esc(d.customerName)}</div>
    <div style="font-size:11px;color:#555">${esc(d.customerAddress || '')}</div>
  </div>
  <div class="grid">
    <div class="field"><div class="label">Instrument</div><div class="value">${esc(d.instrumentName)}</div></div>
    <div class="field"><div class="label">Make / Model</div><div class="value">${esc(d.instrumentMake || '—')} / ${esc(d.instrumentModel || '—')}</div></div>
    <div class="field"><div class="label">Serial No.</div><div class="value">${esc(d.instrumentSerial || '—')}</div></div>
    <div class="field"><div class="label">Range</div><div class="value">${esc(d.instrumentRange || '—')}</div></div>
    <div class="field"><div class="label">Job No.</div><div class="value">${esc(d.jobNumber)}</div></div>
    <div class="field"><div class="label">Calibration Date</div><div class="value">${fmtDate(d.calibrationDate || d.issueDate)}</div></div>
  </div>
  <table><thead><tr><th>Cal. Point</th><th>Unit</th><th>Nominal</th><th>Standard</th><th>Observed</th><th>Correction</th><th>Error</th>${hasPassFail ? '<th>MPE</th><th>Result</th>' : ''}</tr></thead>
  <tbody>${d.observations.map((o) => {
    const pf = o.passFail;
    return `<tr><td>${esc(o.pointLabel)}</td><td>${esc(o.unit)}</td><td>${o.nominal ?? '—'}</td><td>${o.standardValue?.toFixed(4) ?? '—'}</td><td>${o.observedValue?.toFixed(4) ?? '—'}</td><td>${o.correction?.toFixed(4) ?? '—'}</td><td>${o.error?.toFixed(4) ?? '—'}</td>${hasPassFail ? `<td>${esc(o.mpeLimit)}</td><td class="${pf ?? ''}">${pf === 'pass' ? '✓ PASS' : pf === 'fail' ? '✗ FAIL' : '—'}</td>` : ''}</tr>`;
  }).join('')}</tbody></table>
  <div class="unc-bar">Expanded Uncertainty: <b>± ${d.expandedUncertainty?.toFixed(4) ?? '—'} ${esc(unit)}</b> &nbsp;&nbsp; Coverage factor k = ${d.coverageFactor?.toFixed(2) ?? 2} (~95.45% confidence)</div>
  <div style="display:flex; justify-content:space-between; margin-top:32px; gap:20px;">
    ${(d.signatures ?? []).map((s) => `<div style="flex:1;border-top:1px solid #333;padding-top:4px;text-align:center"><b>${esc(s.by)}</b><br/><span style="font-size:10px;color:#555">${esc(s.designation || s.stage)}</span></div>`).join('')}
    ${!(d.signatures ?? []).length ? '<div style="flex:1;border-top:1px solid #333;padding-top:4px;text-align:center"><b>Calibrated By</b><br/><span style="font-size:10px;color:#555">Calibration Engineer</span></div><div style="flex:1;border-top:1px solid #333;padding-top:4px;text-align:center"><b>Authorized Signatory</b><br/><span style="font-size:10px;color:#555">Technical Manager</span></div>' : ''}
  </div>
</div>
<div class="footer">
  <span>This certificate refers only to the particular item(s) submitted for calibration. Results are valid at the time of calibration.</span>
  <span>Page 1 of 1</span>
</div>
</body></html>`;
}
