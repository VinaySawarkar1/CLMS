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
}

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
  revision?: number;                 // 0 = original issue, 1+ = Revision-n
  isDraft?: boolean;                 // true until all signatures collected → DRAFT watermark
  issueDate: Date;
  pageNumber?: number;
  totalPages?: number;

  // Lab info
  labName?: string | null;
  labAddress?: string | null;
  labPhone?: string | null;
  labEmail?: string | null;
  labAccreditation?: string | null;  // NABL CC No.
  labWebsite?: string | null;
  labLogoUrl?: string | null;
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

function renderObservations(rows: ReportObservation[]): string {
  if (!rows.length) {
    return '<tr><td colspan="7" style="text-align:center;color:#888;padding:12px">No observations recorded</td></tr>';
  }
  return rows.map((o) => `<tr>
    <td>${esc(o.pointLabel)}</td>
    <td>${esc(o.unit)}</td>
    <td>${num(o.nominal)}</td>
    <td>${num(o.standardValue)}</td>
    <td>${num(o.observedValue)}</td>
    <td>${num(o.correction)}</td>
    <td>${num(o.error)}</td>
  </tr>`).join('');
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
  const env = d.environmental ?? {};
  const unit = d.uncertaintyUnit ?? d.observations[0]?.unit ?? '';
  const pageNum = d.pageNumber ?? 1;
  const totalPages = d.totalPages ?? 1;
  const calibrationLocation = d.calibrationLocation ?? 'In Lab';
  const ulr = d.ulrNumber ?? '';

  const tempStr = env.temperature !== undefined
    ? `${num(env.temperature, 1)} °C (±${env.temperatureTolerance ?? 1} °C)`
    : '--';
  const humStr = env.humidity !== undefined
    ? `${num(env.humidity, 1)} % RH (±${env.humidityTolerance ?? 10} % RH)`
    : '--';

  return `<!doctype html>
<html><head>
<meta charset="utf-8"/>
<title>Certificate of Calibration — ${esc(d.certificateNumber)}</title>
<style>
  @page { size: A4; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; margin: 0; }
  .page { max-width: 780px; margin: 0 auto; padding: 16px; }

  /* ── Top header ── */
  .top-header { display: flex; align-items: stretch;
    border-bottom: 3px solid #1565c0; padding-bottom: 8px; margin-bottom: 4px; gap: 8px; }
  .lab-info { flex: 0 0 auto; width: 220px; }
  .lab-logo-img { max-height: 52px; max-width: 130px; object-fit: contain; display: block; margin-bottom: 4px; }
  .lab-name-big { font-size: 12px; font-weight: bold; color: #1a237e; line-height: 1.3; }
  .lab-addr { font-size: 9.5px; color: #333; margin-top: 1px; line-height: 1.4; }
  .cert-heading { flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; text-align: center; padding: 0 8px; }
  .cert-heading h1 { font-size: 16px; font-weight: bold; color: #1a237e; margin: 0 0 4px; letter-spacing: 1px; text-transform: uppercase; }
  .cert-heading .issued-by-label { font-size: 10px; color: #444; margin: 0; line-height: 1.4; }
  .cert-heading .issued-by-name { font-size: 11px; font-weight: bold; color: #1a237e; margin: 2px 0 0; }
  .cert-heading .iso-line { font-size: 10px; color: #555; margin-top: 4px; }
  .nabl-logo-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 90px; flex-shrink: 0; }

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

  /* ── Draft watermark (shown until certificate is fully signed/locked) ── */
  .draft-watermark { position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg); z-index: 0; pointer-events: none;
    font-size: 120px; font-weight: 900; letter-spacing: 12px;
    color: rgba(220, 0, 0, 0.12); text-transform: uppercase; white-space: nowrap; }
  .page { position: relative; z-index: 1; }
  .rev-tag { display: inline-block; margin-left: 6px; font-size: 9px; font-weight: bold;
    color: #c62828; border: 1px solid #c62828; border-radius: 3px; padding: 0 3px; vertical-align: middle; }

  @media print { .page { padding: 0; } }
</style>
</head>
<body>
${d.isDraft ? '<div class="draft-watermark">DRAFT</div>' : ''}
<div class="page">

<!-- ══ HEADER ══════════════════════════════════════════════════════ -->
<div class="top-header">

  <!-- LEFT: Lab logo + name + address -->
  <div class="lab-info">
    ${d.labLogoUrl ? `<img class="lab-logo-img" src="${esc(d.labLogoUrl)}" alt="Lab Logo"/>` : ''}
    <div class="lab-name-big">${esc(d.labName || 'Calibration Laboratory')}</div>
    ${d.labAddress ? `<div class="lab-addr">${esc(d.labAddress)}</div>` : ''}
    ${(d.labPhone || d.labEmail) ? `<div class="lab-addr">${d.labPhone ? 'Tel: ' + esc(d.labPhone) : ''}${d.labPhone && d.labEmail ? ' &nbsp;|&nbsp; ' : ''}${d.labEmail ? 'E: ' + esc(d.labEmail) : ''}</div>` : ''}
    ${d.labWebsite ? `<div class="lab-addr">Web: ${esc(d.labWebsite)}</div>` : ''}
  </div>

  <!-- CENTER: Certificate title -->
  <div class="cert-heading">
    <h1>CERTIFICATE OF CALIBRATION</h1>
    <div class="issued-by-label">ISSUED BY</div>
    <div class="issued-by-name">${esc(d.labName || 'Calibration Laboratory')}</div>
    <div class="iso-line">ISO / IEC 17025 · NABL</div>
  </div>

  <!-- RIGHT: NABL circular stamp -->
  <div class="nabl-logo-wrap">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="82" height="82" aria-label="NABL Logo">
      <defs>
        <path id="topArc"  d="M 14,100 A 86,86 0 0,1 186,100"/>
        <path id="botArc"  d="M 22,116 A 80,80 0 0,0 178,116"/>
      </defs>
      <!-- Outer navy ring -->
      <circle cx="100" cy="100" r="98" fill="#1a237e"/>
      <circle cx="100" cy="100" r="88" fill="#fff"/>
      <circle cx="100" cy="100" r="82" fill="none" stroke="#1a237e" stroke-width="1"/>
      <!-- Inner filled circle -->
      <circle cx="100" cy="100" r="64" fill="#1a237e"/>
      <circle cx="100" cy="100" r="58" fill="#fff"/>
      <!-- Six-pointed star (simpler than 5) — use 5-pointed -->
      <polygon points="100,44 112,80 150,80 120,102 131,138 100,116 69,138 80,102 50,80 88,80"
               fill="#1a237e"/>
      <!-- Arc text top -->
      <text font-family="Arial,sans-serif" font-size="9" fill="#fff" font-weight="bold" letter-spacing="0.3">
        <textPath href="#topArc" startOffset="3%">NATIONAL ACCREDITATION BOARD FOR TESTING AND</textPath>
      </text>
      <!-- Arc text bottom -->
      <text font-family="Arial,sans-serif" font-size="9" fill="#fff" font-weight="bold" letter-spacing="0.3">
        <textPath href="#botArc" startOffset="12%">CALIBRATION LABORATORIES</textPath>
      </text>
      <!-- NABL label at bottom -->
      <text x="100" y="192" font-family="Arial Black,Arial,sans-serif" font-size="18" fill="#1a237e"
            text-anchor="middle" font-weight="900" letter-spacing="2">NABL</text>
    </svg>
    ${d.labAccreditation ? `<div style="font-size:9px;color:#1a237e;font-weight:bold;text-align:center;margin-top:1px">${esc(d.labAccreditation)}</div>` : ''}
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
      <td><b>${esc(d.certificateNumber)}</b>${d.revision && d.revision > 0 ? `<span class="rev-tag">REV ${d.revision}</span>` : ''}</td>
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
    </tr></thead>
    <tbody>${renderObservations(d.observations)}</tbody>
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
