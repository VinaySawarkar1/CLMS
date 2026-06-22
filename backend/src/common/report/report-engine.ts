/**
 * CLMS Report Engine
 * ------------------
 * Renders calibration certificates and draft reports to self-contained HTML
 * (print/PDF-ready). HTML keeps the engine dependency-free; a downstream PDF
 * step (e.g. Puppeteer/wkhtmltopdf) can convert the same markup to PDF.
 */

export interface ReportObservation {
  pointLabel?: string | null;
  nominal?: number | null;
  standardValue?: number | null;
  observedValue?: number | null;
  correction?: number | null;
  error?: number | null;
}

export interface CertificateReportData {
  certificateNumber: string;
  type: string;
  issueDate: Date;
  customerName: string;
  instrumentName: string;
  instrumentMake?: string | null;
  instrumentModel?: string | null;
  instrumentSerial?: string | null;
  jobNumber: string;
  environmental?: { temperature?: number; humidity?: number; pressure?: number } | null;
  observations: ReportObservation[];
  expandedUncertainty?: number | null;
  coverageFactor?: number | null;
  decisionRule?: string | null;
  traceability?: string | null;
  qrVerificationUrl?: string | null;
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

function observationRows(rows: ReportObservation[]): string {
  return rows
    .map(
      (o) => `<tr>
        <td>${esc(o.pointLabel)}</td>
        <td>${num(o.nominal)}</td>
        <td>${num(o.standardValue)}</td>
        <td>${num(o.observedValue)}</td>
        <td>${num(o.correction)}</td>
        <td>${num(o.error)}</td>
      </tr>`,
    )
    .join('');
}

export function renderCertificateHtml(d: CertificateReportData): string {
  const env = d.environmental ?? {};
  return `<!doctype html>
<html><head><meta charset="utf-8" />
<title>${esc(d.certificateNumber)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; margin: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1565c0; padding-bottom: 12px; }
  .title { font-size: 20px; font-weight: bold; color: #1565c0; }
  .meta td { padding: 2px 8px; font-size: 13px; }
  table.data { border-collapse: collapse; width: 100%; margin-top: 16px; }
  table.data th, table.data td { border: 1px solid #999; padding: 6px 8px; font-size: 12px; text-align: center; }
  table.data th { background: #e3f2fd; }
  .section { margin-top: 20px; }
  .label { color: #555; font-size: 12px; }
  .sign { display: flex; gap: 32px; margin-top: 40px; }
  .sign div { font-size: 12px; }
  .footer { margin-top: 24px; font-size: 11px; color: #666; }
</style></head>
<body>
  <div class="header">
    <div>
      <div class="title">Calibration Certificate</div>
      <div class="label">${esc(d.type)} · ISO/IEC 17025</div>
    </div>
    <div>
      <table class="meta">
        <tr><td class="label">Certificate No.</td><td><b>${esc(d.certificateNumber)}</b></td></tr>
        <tr><td class="label">Issue Date</td><td>${esc(d.issueDate.toISOString().slice(0, 10))}</td></tr>
        <tr><td class="label">Job No.</td><td>${esc(d.jobNumber)}</td></tr>
      </table>
    </div>
  </div>

  <div class="section">
    <table class="meta">
      <tr><td class="label">Customer</td><td>${esc(d.customerName)}</td></tr>
      <tr><td class="label">Instrument</td><td>${esc(d.instrumentName)}</td></tr>
      <tr><td class="label">Make / Model</td><td>${esc(d.instrumentMake)} / ${esc(d.instrumentModel)}</td></tr>
      <tr><td class="label">Serial No.</td><td>${esc(d.instrumentSerial)}</td></tr>
      <tr><td class="label">Conditions</td><td>${num(env.temperature, 1)} °C, ${num(env.humidity, 1)} %RH, ${num(env.pressure, 1)} kPa</td></tr>
    </table>
  </div>

  <div class="section">
    <table class="data">
      <thead><tr>
        <th>Point</th><th>Nominal</th><th>Standard</th><th>Observed</th><th>Correction</th><th>Error</th>
      </tr></thead>
      <tbody>${observationRows(d.observations)}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="label">Expanded Uncertainty: <b>±${num(d.expandedUncertainty)}</b>
      (k = ${num(d.coverageFactor, 2)}, ~95.45% confidence)</div>
    ${d.decisionRule ? `<div class="label">Decision Rule: ${esc(d.decisionRule)}</div>` : ''}
    ${d.traceability ? `<div class="label">Traceability: ${esc(d.traceability)}</div>` : ''}
  </div>

  <div class="sign">
    ${(d.signatures ?? [])
      .map((s) => `<div><b>${esc(s.by)}</b><br/>${esc(s.stage)}</div>`)
      .join('')}
  </div>

  <div class="footer">
    ${d.qrVerificationUrl ? `Verify online: ${esc(d.qrVerificationUrl)}` : ''}
  </div>
</body></html>`;
}
