/**
 * CLMS Report Engine
 * Renders calibration certificates to self-contained HTML (print/PDF-ready).
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
  make?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  certificateNumber?: string | null;
  traceability?: string | null;
  uncertainty?: string | null;
  calibrationDue?: Date | null;
}

export interface CertificateReportData {
  certificateNumber: string;
  type: string;
  issueDate: Date;
  customerName: string;
  customerAddress?: string | null;
  instrumentName: string;
  instrumentMake?: string | null;
  instrumentModel?: string | null;
  instrumentSerial?: string | null;
  instrumentRange?: string | null;
  instrumentLeastCount?: string | null;
  labName?: string | null;
  labAccreditation?: string | null;
  jobNumber: string;
  environmental?: { temperature?: number; humidity?: number; pressure?: number } | null;
  observations: ReportObservation[];
  expandedUncertainty?: number | null;
  coverageFactor?: number | null;
  decisionRule?: string | null;
  traceability?: string | null;
  referenceStandards?: ReferenceStandardInfo[];
  qrVerificationUrl?: string | null;
  qrDataUrl?: string | null;
  signatures?: Array<{ stage: string; by: string }>;
}

function esc(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function num(value: number | null | undefined, digits = 4): string {
  return value === null || value === undefined ? '—' : value.toFixed(digits);
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function observationRows(rows: ReportObservation[]): string {
  if (!rows.length) return '<tr><td colspan="7" style="text-align:center;color:#999;">No observations recorded</td></tr>';
  return rows
    .map(
      (o) => `<tr>
        <td>${esc(o.pointLabel)}</td>
        <td>${esc(o.unit)}</td>
        <td>${num(o.nominal)}</td>
        <td>${num(o.standardValue)}</td>
        <td>${num(o.observedValue)}</td>
        <td>${num(o.correction)}</td>
        <td>${num(o.error)}</td>
      </tr>`,
    )
    .join('');
}

function referenceStandardRows(refs: ReferenceStandardInfo[]): string {
  if (!refs.length) return '';
  return `
  <div class="section">
    <div class="section-title">Reference Standards Used</div>
    <table class="data">
      <thead><tr>
        <th>Instrument</th><th>ID / Serial</th><th>Make / Model</th>
        <th>Cert No.</th><th>Traceability</th><th>Uncertainty</th><th>Due Date</th>
      </tr></thead>
      <tbody>
        ${refs.map((r) => `<tr>
          <td style="text-align:left">${esc(r.name)}</td>
          <td>${esc(r.idNumber)}${r.serialNumber ? ' / ' + esc(r.serialNumber) : ''}</td>
          <td>${esc(r.make)}${r.model ? ' ' + esc(r.model) : ''}</td>
          <td>${esc(r.certificateNumber)}</td>
          <td style="text-align:left;font-size:11px">${esc(r.traceability)}</td>
          <td>${esc(r.uncertainty)}</td>
          <td>${fmtDate(r.calibrationDue)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

export function renderCertificateHtml(d: CertificateReportData): string {
  const env = d.environmental ?? {};
  const hasEnv = env.temperature !== undefined || env.humidity !== undefined;
  const unit = d.observations[0]?.unit ?? '';

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<title>Certificate ${esc(d.certificateNumber)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; margin: 0; font-size: 13px; }
  .page { max-width: 780px; margin: 0 auto; padding: 24px; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 3px solid #1565c0; padding-bottom: 14px; margin-bottom: 16px; }
  .logo-area { flex: 1; }
  .lab-name { font-size: 18px; font-weight: bold; color: #1565c0; }
  .cert-title { font-size: 14px; font-weight: bold; color: #0d47a1; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
  .accred { font-size: 11px; color: #555; margin-top: 2px; }
  .cert-meta { text-align: right; }
  .cert-meta table td { padding: 2px 4px; font-size: 12px; }
  .cert-no { font-size: 16px; font-weight: bold; color: #1565c0; }

  /* Info sections */
  .section { margin-top: 16px; }
  .section-title { font-weight: bold; font-size: 12px; color: #1565c0; text-transform: uppercase;
    letter-spacing: 0.5px; border-bottom: 1px solid #bbdefb; padding-bottom: 3px; margin-bottom: 8px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .info-row { display: flex; padding: 3px 0; border-bottom: 1px solid #f0f0f0; }
  .info-label { color: #555; font-size: 11px; width: 150px; flex-shrink: 0; }
  .info-value { font-size: 12px; font-weight: 500; }

  /* Data tables */
  table.data { border-collapse: collapse; width: 100%; margin-top: 8px; font-size: 12px; }
  table.data th, table.data td { border: 1px solid #90caf9; padding: 5px 7px; text-align: center; }
  table.data th { background: #e3f2fd; font-size: 11px; font-weight: bold; }
  table.data tr:nth-child(even) { background: #fafbff; }

  /* Uncertainty */
  .unc-box { background: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 4px; padding: 10px 14px; margin-top: 12px; font-size: 12px; }
  .unc-main { font-size: 15px; font-weight: bold; color: #1b5e20; }

  /* Decision rule */
  .decision-box { background: #fff3e0; border: 1px solid #ffcc80; border-radius: 4px; padding: 8px 12px; margin-top: 10px; font-size: 12px; }

  /* Signatures */
  .sign-section { margin-top: 32px; display: flex; gap: 40px; }
  .sign-block { flex: 1; border-top: 1px solid #333; padding-top: 8px; font-size: 12px; }
  .sign-name { font-weight: bold; }

  /* QR */
  .footer-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px;
    border-top: 1px solid #ccc; padding-top: 12px; }
  .footer-text { font-size: 10px; color: #666; max-width: 500px; }
  .qr-area { text-align: center; }
  .qr-area img { width: 100px; height: 100px; border: 1px solid #ccc; padding: 2px; }
  .qr-label { font-size: 9px; color: #666; margin-top: 2px; }

  @media print {
    .page { padding: 0; }
  }
</style></head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo-area">
      <div class="lab-name">${esc(d.labName || 'Calibration Laboratory')}</div>
      <div class="cert-title">Calibration Certificate</div>
      <div class="accred">${d.labAccreditation ? 'Accreditation No.: ' + esc(d.labAccreditation) + ' · ' : ''}ISO/IEC 17025 · ${esc(d.type)}</div>
    </div>
    <div class="cert-meta">
      <div class="cert-no">${esc(d.certificateNumber)}</div>
      <table><tbody>
        <tr><td style="color:#555;font-size:11px">Issue Date</td><td><b>${fmtDate(d.issueDate)}</b></td></tr>
        <tr><td style="color:#555;font-size:11px">Job No.</td><td>${esc(d.jobNumber)}</td></tr>
      </tbody></table>
    </div>
  </div>

  <!-- Customer & Instrument -->
  <div class="info-grid">
    <div class="section">
      <div class="section-title">Customer Details</div>
      <div class="info-row"><span class="info-label">Customer Name</span><span class="info-value">${esc(d.customerName)}</span></div>
      ${d.customerAddress ? `<div class="info-row"><span class="info-label">Address</span><span class="info-value">${esc(d.customerAddress)}</span></div>` : ''}
    </div>
    <div class="section" style="margin-left:16px">
      <div class="section-title">Instrument Under Test</div>
      <div class="info-row"><span class="info-label">Description</span><span class="info-value">${esc(d.instrumentName)}</span></div>
      <div class="info-row"><span class="info-label">Make / Model</span><span class="info-value">${esc(d.instrumentMake)} / ${esc(d.instrumentModel)}</span></div>
      <div class="info-row"><span class="info-label">Serial No.</span><span class="info-value">${esc(d.instrumentSerial) || '—'}</span></div>
      ${d.instrumentRange ? `<div class="info-row"><span class="info-label">Range</span><span class="info-value">${esc(d.instrumentRange)}</span></div>` : ''}
      ${d.instrumentLeastCount ? `<div class="info-row"><span class="info-label">Least Count</span><span class="info-value">${esc(d.instrumentLeastCount)}</span></div>` : ''}
    </div>
  </div>

  <!-- Conditions -->
  ${hasEnv ? `
  <div class="section">
    <div class="section-title">Environmental Conditions</div>
    <div style="display:flex;gap:32px;font-size:12px;padding:6px 0">
      ${env.temperature !== undefined ? `<span><b>Temperature:</b> ${num(env.temperature, 1)} °C</span>` : ''}
      ${env.humidity !== undefined ? `<span><b>Relative Humidity:</b> ${num(env.humidity, 1)} %RH</span>` : ''}
      ${env.pressure !== undefined ? `<span><b>Atmospheric Pressure:</b> ${num(env.pressure, 1)} kPa</span>` : ''}
    </div>
  </div>` : ''}

  <!-- Observations -->
  <div class="section">
    <div class="section-title">Calibration Results</div>
    <table class="data">
      <thead><tr>
        <th>Cal. Point</th><th>Unit</th><th>Nominal Value</th>
        <th>Standard Value</th><th>Observed Value</th><th>Correction</th><th>Error</th>
      </tr></thead>
      <tbody>${observationRows(d.observations)}</tbody>
    </table>
  </div>

  <!-- Uncertainty -->
  <div class="section">
    <div class="unc-box">
      <div class="unc-main">Expanded Uncertainty: ±${num(d.expandedUncertainty, 4)} ${esc(unit)}</div>
      <div style="margin-top:4px">Coverage Factor k = ${num(d.coverageFactor, 2)} · Confidence Level ≈ 95.45% · Normal Distribution</div>
      ${d.traceability ? `<div style="margin-top:4px;font-size:11px;color:#2e7d32">Traceability: ${esc(d.traceability)}</div>` : ''}
    </div>
  </div>

  <!-- Decision Rule -->
  ${d.decisionRule ? `
  <div class="decision-box">
    <b>Decision Rule (ILAC-G8):</b> ${esc(d.decisionRule)}
  </div>` : ''}

  <!-- Reference Standards -->
  ${referenceStandardRows(d.referenceStandards ?? [])}

  <!-- Signatures -->
  ${(d.signatures ?? []).length > 0 ? `
  <div class="sign-section">
    ${(d.signatures ?? []).map((s) => `
    <div class="sign-block">
      <div class="sign-name">${esc(s.by)}</div>
      <div style="color:#555;font-size:11px">${esc(s.stage)}</div>
    </div>`).join('')}
  </div>` : ''}

  <!-- Footer with QR -->
  <div class="footer-row">
    <div class="footer-text">
      <b>Note:</b> The expanded uncertainty is reported at a coverage factor k = ${num(d.coverageFactor, 2)},
      giving a level of confidence of approximately 95.45%. This certificate shall not be reproduced
      except in full, without written approval of the laboratory.
      ${d.qrVerificationUrl ? `<br/>Verify authenticity at: <code>${esc(d.qrVerificationUrl)}</code>` : ''}
    </div>
    ${d.qrDataUrl ? `
    <div class="qr-area">
      <img src="${d.qrDataUrl}" alt="Verify QR" />
      <div class="qr-label">Scan to verify</div>
    </div>` : ''}
  </div>

</div>
</body></html>`;
}
