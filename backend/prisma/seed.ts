import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const DISCIPLINES = [
  'Mechanical', 'Electrical', 'Pressure', 'Temperature', 'Mass', 'Dimension',
  'Flow', 'Volume', 'Force', 'Torque', 'Humidity', 'RPM', 'Time Frequency', 'Acoustics',
];

const ALL_PERMISSION_KEYS = [
  'customers', 'instruments', 'jobs', 'certificates', 'billing',
  'tasks', 'engineers', 'inventory', 'environmental', 'quality', 'audit', 'notifications',
  'documents', 'internal-audit',
];

// Default permissions per role (LAB_ADMIN can override these)
const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  TECHNICAL_MANAGER: ALL_PERMISSION_KEYS,
  CALIBRATION_ENGINEER: ['customers', 'instruments', 'jobs', 'certificates', 'tasks', 'environmental', 'documents', 'internal-audit'],
  SERVICE_ENGINEER: ['customers', 'instruments', 'jobs', 'tasks'],
  DATA_ENTRY_OPERATOR: ['customers', 'instruments', 'jobs', 'notifications'],
};

async function seedPermissions(labId: string) {
  for (const [role, granted] of Object.entries(DEFAULT_PERMISSIONS)) {
    for (const key of ALL_PERMISSION_KEYS) {
      await prisma.labRolePermission.upsert({
        where: { labId_role_permissionKey: { labId, role: role as Role, permissionKey: key } },
        update: {},
        create: { labId, role: role as Role, permissionKey: key, granted: granted.includes(key) },
      });
    }
  }
}

async function main() {
  // 1. Super Admin (platform-level, no lab)
  const superAdminEmail = 'admin@clms.local';
  await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash: await bcrypt.hash('admin123', 10),
      fullName: 'Platform Administrator',
      role: 'SUPER_ADMIN',
      labId: null,
    },
  });

  // 2. Seed global disciplines
  for (const name of DISCIPLINES) {
    const code = name.replace(/\s+/g, '_').toUpperCase();
    await prisma.discipline.upsert({
      where: { code },
      update: {},
      create: { name, code },
    });
  }

  // 3. Demo Lab — ensure it exists (find-or-create by accreditation number).
  let demoLab = await prisma.lab.findFirst({ where: { accreditationNumber: 'CC-3456' } });
  if (!demoLab) {
    demoLab = await prisma.lab.create({
      data: {
        name: 'Demo Calibration Laboratory',
        accreditationNumber: 'CC-3456',
        address: '123 Precision Road, Mumbai 400001',
        contactEmail: 'lab@democalib.in',
        status: 'APPROVED',
      },
    });
  }
  const labId = demoLab.id;

  // Lab Admin
  const labAdmin = await prisma.user.upsert({
    where: { email: 'labadmin@democalib.in' },
    update: {},
    create: {
      email: 'labadmin@democalib.in',
      passwordHash: await bcrypt.hash('labadmin123', 10),
      fullName: 'Lab Administrator',
      role: 'LAB_ADMIN',
      labId,
    },
  });
  await seedPermissions(labId);

  // 4. Rich sample data — runs once, guarded by a version flag.
  const SEED_FLAG = 'seed:demo:v2';
  const already = await prisma.setting.findUnique({ where: { key: SEED_FLAG } });
  if (!already) {
    await seedSampleData(labId, labAdmin.id);
    await prisma.setting.upsert({
      where: { key: SEED_FLAG },
      update: {},
      create: { key: SEED_FLAG, value: true },
    });
    console.log('Rich sample data seeded for Demo Calibration Laboratory.');
  }

  console.log('Seed complete.');
  console.log('Super Admin: admin@clms.local / admin123');
  console.log('Lab Admin:   labadmin@democalib.in / labadmin123');
}

// Helper: a date offset by N days from now.
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

async function seedSampleData(labId: string, adminUserId: string) {
  const disciplines = await prisma.discipline.findMany();
  const discId = (name: string) => disciplines.find((d) => d.name === name)?.id;

  // ── Customers (6) + Contacts ──
  const customerSpecs = [
    { code: 'CUST-001', name: 'Precision Tools Pvt. Ltd.', gstin: '27ABCDE1234F1Z5', email: 'qa@precisiontools.in', phone: '+91-9800000001', address: 'Plot 14, MIDC Bhosari, Pune 411026' },
    { code: 'CUST-002', name: 'Acme Instruments', email: 'lab@acme.in', phone: '+91-9800000002', address: '5 Industrial Estate, Mumbai 400072' },
    { code: 'CUST-003', name: 'Bharat Heavy Engineering', gstin: '27BHEL9876K1Z2', email: 'calib@bhel.in', phone: '+91-9800000003', address: 'Sector 7, Nashik 422007' },
    { code: 'CUST-004', name: 'Sunrise Pharma Ltd.', gstin: '27SUNP1122M1Z9', email: 'metrology@sunrisepharma.in', phone: '+91-9800000004', address: 'Pharma Zone, Aurangabad 431005' },
    { code: 'CUST-005', name: 'Deccan Auto Components', email: 'quality@deccanauto.in', phone: '+91-9800000005', address: 'Chakan Belt, Pune 410501' },
    { code: 'CUST-006', name: 'Konkan Power Systems', gstin: '27KPS44556P1Z1', email: 'lab@konkanpower.in', phone: '+91-9800000006', address: 'Ratnagiri Industrial Area 415612' },
  ];
  const customers: any[] = [];
  for (const c of customerSpecs) {
    const cust = await prisma.customer.upsert({
      where: { labId_code: { labId, code: c.code } },
      update: {},
      create: { labId, ...c },
    });
    customers.push(cust);
    await prisma.contact.create({
      data: { customerId: cust.id, name: `${c.name.split(' ')[0]} QA Head`, email: c.email ?? null, phone: c.phone ?? null, designation: 'Quality Manager' },
    });
  }

  // ── Reference Standards / Master Instruments (6) ──
  const masterSpecs = [
    { idNumber: 'STD-001', name: 'Gauge Block Set (Grade 0)', make: 'Mitutoyo', model: '516-940', serialNumber: 'GB-2201', traceability: 'Traceable to NPL India', certificateNumber: 'NPL/2025/1123', uncertainty: '±0.10 µm', location: 'Dimensional Lab' },
    { idNumber: 'STD-002', name: 'Digital Pressure Calibrator', make: 'Fluke', model: '719Pro', serialNumber: 'FP-8841', traceability: 'Traceable to NABL Lab CC-1102', certificateNumber: 'CC1102/25/882', uncertainty: '±0.02 bar', location: 'Pressure Lab' },
    { idNumber: 'STD-003', name: 'Dry Block Temperature Calibrator', make: 'Ametek', model: 'RTC-700', serialNumber: 'AM-5521', traceability: 'Traceable to NPL India', certificateNumber: 'NPL/2025/2241', uncertainty: '±0.15 °C', location: 'Thermal Lab' },
    { idNumber: 'STD-004', name: 'Standard Weight Set (E2)', make: 'Sartorius', model: 'YCW-E2', serialNumber: 'SW-9912', traceability: 'Traceable to NPL India', certificateNumber: 'NPL/2025/3310', uncertainty: '±0.05 mg', location: 'Mass Lab' },
    { idNumber: 'STD-005', name: 'Multifunction Calibrator', make: 'Fluke', model: '5522A', serialNumber: 'FL-7781', traceability: 'Traceable to NABL Lab CC-2207', certificateNumber: 'CC2207/25/451', uncertainty: '±0.01 %', location: 'Electrical Lab' },
    { idNumber: 'STD-006', name: 'Reference Tachometer', make: 'Lutron', model: 'DT-2236', serialNumber: 'LT-3345', traceability: 'Traceable to NPL India', certificateNumber: 'NPL/2025/4120', uncertainty: '±0.5 rpm', location: 'Mechanical Lab' },
  ];
  const masters: any[] = [];
  for (const m of masterSpecs) {
    const master = await prisma.masterInstrument.upsert({
      where: { labId_idNumber: { labId, idNumber: m.idNumber } },
      update: {},
      create: { labId, ...m, calibratedDate: daysFromNow(-30), calibrationDue: daysFromNow(335) },
    });
    masters.push(master);
  }

  // ── Engineers (5) ──
  const engineerSpecs = [
    { code: 'ENG-001', name: 'R. Kumar', email: 'r.kumar@democalib.in', skills: ['Dimension', 'Pressure'], role: 'CALIBRATION_ENGINEER' as Role },
    { code: 'ENG-002', name: 'S. Patil', email: 's.patil@democalib.in', skills: ['Thermal', 'Humidity'], role: 'CALIBRATION_ENGINEER' as Role },
    { code: 'ENG-003', name: 'A. Sharma', email: 'a.sharma@democalib.in', skills: ['Electrical', 'Frequency'], role: 'CALIBRATION_ENGINEER' as Role },
    { code: 'ENG-004', name: 'M. Iyer', email: 'm.iyer@democalib.in', skills: ['Mass', 'Volume'], role: 'CALIBRATION_ENGINEER' as Role },
    { code: 'ENG-005', name: 'V. Singh', email: 'v.singh@democalib.in', skills: ['Onsite', 'Pressure'], role: 'SERVICE_ENGINEER' as Role },
  ];
  const engineers: any[] = [];
  for (const e of engineerSpecs) {
    const user = await prisma.user.upsert({
      where: { email: e.email },
      update: {},
      create: { email: e.email, passwordHash: await bcrypt.hash('engineer123', 10), fullName: e.name, role: e.role, labId },
    });
    const eng = await prisma.engineer.upsert({
      where: { employeeCode: e.code },
      update: {},
      create: { userId: user.id, employeeCode: e.code, skills: e.skills, authorizations: e.skills },
    });
    engineers.push(eng);
  }

  // ── Instruments (8) ──
  const instrumentSpecs = [
    { customer: 0, name: 'Digital Vernier Caliper', make: 'Mitutoyo', model: 'CD-6ASX', serialNumber: 'MT-100245', range: '0-150 mm', leastCount: '0.01 mm', unit: 'mm', idNumber: 'INS-001', discipline: 'Mechanical', interval: 12 },
    { customer: 0, name: 'Outside Micrometer', make: 'Mitutoyo', model: '103-137', serialNumber: 'MT-200881', range: '0-25 mm', leastCount: '0.001 mm', unit: 'mm', idNumber: 'INS-002', discipline: 'Mechanical', interval: 12 },
    { customer: 1, name: 'Pressure Gauge', make: 'Wika', model: '232.50', serialNumber: 'WK-553', range: '0-25 bar', leastCount: '0.1 bar', unit: 'bar', idNumber: 'INS-003', discipline: 'Pressure', interval: 6 },
    { customer: 2, name: 'Digital Thermometer', make: 'Fluke', model: '1523', serialNumber: 'FK-9921', range: '-50-300 °C', leastCount: '0.01 °C', unit: '°C', idNumber: 'INS-004', discipline: 'Thermal', interval: 12 },
    { customer: 3, name: 'Analytical Balance', make: 'Sartorius', model: 'BSA224S', serialNumber: 'SR-3312', range: '0-220 g', leastCount: '0.1 mg', unit: 'g', idNumber: 'INS-005', discipline: 'Mass & Volume', interval: 12 },
    { customer: 3, name: 'Digital Multimeter', make: 'Fluke', model: '87V', serialNumber: 'FK-1187', range: '0-1000 V', leastCount: '0.001 V', unit: 'V', idNumber: 'INS-006', discipline: 'Electro Technical', interval: 12 },
    { customer: 4, name: 'Torque Wrench', make: 'Stahlwille', model: '730N', serialNumber: 'ST-4456', range: '20-200 N·m', leastCount: '0.1 N·m', unit: 'N·m', idNumber: 'INS-007', discipline: 'Force & Torque', interval: 6 },
    { customer: 5, name: 'Tachometer (Non-contact)', make: 'Lutron', model: 'DT-2234C', serialNumber: 'LT-7789', range: '5-99999 rpm', leastCount: '0.1 rpm', unit: 'rpm', idNumber: 'INS-008', discipline: 'Speed & Time', interval: 12 },
  ];
  const instruments: any[] = [];
  for (const i of instrumentSpecs) {
    const inst = await prisma.instrument.create({
      data: {
        labId, customerId: customers[i.customer].id,
        name: i.name, make: i.make, model: i.model, serialNumber: i.serialNumber,
        range: i.range, leastCount: i.leastCount, unit: i.unit, idNumber: i.idNumber,
        disciplineId: discId(i.discipline) ?? null,
        calibrationIntervalMonths: i.interval,
        lastCalibrationDate: daysFromNow(-60),
        nextDueDate: daysFromNow(i.interval * 30 - 60),
      },
    });
    instruments.push(inst);
  }

  // ── Jobs (8) across statuses, some onsite ──
  const jobStatuses: any[] = ['RECEIVED', 'ASSIGNED', 'IN_CALIBRATION', 'PENDING_REVIEW', 'APPROVED', 'CERTIFICATE_GENERATED', 'DELIVERED', 'IN_CALIBRATION'];
  const jobs: any[] = [];
  for (let i = 0; i < 8; i++) {
    const inst = instruments[i];
    const onsite = i === 7;
    const jobNumber = `JOB-2026-${String(i + 1).padStart(5, '0')}`;
    const job = await prisma.job.upsert({
      where: { labId_jobNumber: { labId, jobNumber } },
      update: {},
      create: {
        labId, jobNumber,
        customerId: inst.customerId, instrumentId: inst.id,
        engineerId: i % 2 === 0 ? engineers[i % engineers.length].id : null,
        status: jobStatuses[i],
        challanNo: `DC-${1700 + i}`, conditionOfItem: 'OK (As Received)',
        calibrationProcedureNo: `CM-${40 + i}`, referenceDocumentNo: 'Comparison Method',
        isOnsite: onsite,
        siteAddress: onsite ? 'Konkan Power Systems, Ratnagiri 415612' : null,
        siteContact: onsite ? 'Mr. Deshpande +91-9800000006' : null,
        visitDate: onsite ? daysFromNow(3) : null,
        receivedAt: daysFromNow(-(10 - i)),
      },
    });
    jobs.push(job);
    // link a couple of reference standards used
    await prisma.referenceStandardOnJob.create({ data: { jobId: job.id, masterId: masters[i % masters.length].id } }).catch(() => {});
  }

  // ── Datasheets + observations + uncertainty (5) ──
  for (let i = 0; i < 5; i++) {
    const job = jobs[i];
    const ds = await prisma.datasheet.create({
      data: {
        jobId: job.id, templateName: `${instruments[i].name} Calibration`, version: 1,
        environmental: { temperature: 23 + i * 0.1, humidity: 50, pressure: 101.3 },
        observations: {
          create: [0.25, 0.5, 0.75, 1.0].map((f, k) => {
            const nominal = (k + 1) * 10;
            const observed = nominal + (Math.random() * 0.02 - 0.01);
            return {
              pointLabel: `${nominal} ${instruments[i].unit}`, unit: instruments[i].unit,
              nominal, standardValue: nominal, observedValue: Number(observed.toFixed(4)),
              correction: Number((nominal - observed).toFixed(4)), error: Number((observed - nominal).toFixed(4)),
              data: { readings: [observed, observed + 0.001, observed - 0.001], uA: 0.0006 },
            };
          }),
        },
      },
    });
    await prisma.uncertaintyBudget.create({
      data: {
        datasheetId: ds.id, combinedUncertainty: 0.0035, coverageFactor: 2,
        expandedUncertainty: 0.007, confidenceLevel: 95.45,
        parameters: {
          create: [
            { source: 'Repeatability (Type A)', type: 'A', value: 0.0006, divisor: 1, sensitivity: 1, unit: instruments[i].unit },
            { source: 'Reference standard uncertainty', type: 'B', value: 0.005, distribution: 'normal', divisor: 2, sensitivity: 1, unit: instruments[i].unit },
            { source: 'Resolution of UUC', type: 'B', value: 0.005, distribution: 'rectangular', divisor: Math.sqrt(3), sensitivity: 1, unit: instruments[i].unit },
          ],
        },
      },
    });
  }

  // ── Certificates + signatures (5) for jobs 4..8 ──
  for (let i = 3; i < 8; i++) {
    const job = jobs[i];
    const existingCert = await prisma.certificate.findUnique({ where: { jobId: job.id } });
    if (existingCert) continue;
    const locked = i < 6;
    const cert = await prisma.certificate.create({
      data: {
        jobId: job.id, certificateNumber: `CC/2026/${String(10001 + i).padStart(5, '0')}`,
        type: 'NABL', issueDate: daysFromNow(-(8 - i)), isLocked: locked,
        decisionRule: 'Simple acceptance (ILAC-G8): conformity stated without guard band.',
        qrHash: `demohash${i}`,
        signatures: {
          create: locked
            ? [
                { stage: 'ENGINEER', signedById: engineers[0].id, signedByName: 'R. Kumar', signatureHash: `sig-e-${i}` },
                { stage: 'TECHNICAL_MANAGER', signedById: adminUserId, signedByName: 'Lab Administrator', signatureHash: `sig-t-${i}` },
              ]
            : [{ stage: 'ENGINEER', signedById: engineers[0].id, signedByName: 'R. Kumar', signatureHash: `sig-e-${i}` }],
        },
      },
    });
    void cert;
  }

  // ── Tasks (6) ──
  const taskSpecs = [
    { title: 'Calibrate caliper MT-100245', status: 'RUNNING', eng: 0 },
    { title: 'Review pressure gauge datasheet', status: 'REVIEW', eng: null },
    { title: 'Prepare certificate for JOB-2026-00005', status: 'PENDING', eng: 1 },
    { title: 'Onsite visit — Konkan Power Systems', status: 'PENDING', eng: 4 },
    { title: 'Verify reference weight set STD-004', status: 'DONE', eng: 3 },
    { title: 'Monthly balance intermediate check', status: 'RUNNING', eng: 2 },
  ];
  for (const t of taskSpecs) {
    await prisma.task.create({
      data: { labId, title: t.title, status: t.status, engineerId: t.eng !== null ? engineers[t.eng].id : null, dueDate: daysFromNow(5) },
    });
  }

  // ── Quotations (5) ──
  for (let i = 0; i < 5; i++) {
    const items = [
      { description: `Calibration of ${instruments[i].name}`, qty: 1, rate: 800 + i * 100 },
      { description: 'Onsite charges', qty: 1, rate: 500 },
    ];
    const amount = items.reduce((s, it) => s + it.qty * it.rate, 0);
    const taxAmount = amount * 0.18;
    await prisma.quotation.upsert({
      where: { labId_quoteNumber: { labId, quoteNumber: `QT-2026-${String(i + 1).padStart(5, '0')}` } },
      update: {},
      create: {
        labId, quoteNumber: `QT-2026-${String(i + 1).padStart(5, '0')}`,
        customerId: customers[i].id, status: (['DRAFT', 'SENT', 'ACCEPTED', 'SENT', 'REJECTED'] as any)[i],
        items: items as any, amount, taxRate: 18, taxAmount, totalAmount: amount + taxAmount,
        validUntil: daysFromNow(30), notes: 'Valid for 30 days. GST extra as applicable.',
      },
    });
  }

  // ── Invoices (5) + payments ──
  for (let i = 0; i < 5; i++) {
    const amount = 1200 + i * 250;
    const taxAmount = amount * 0.18;
    const total = amount + taxAmount;
    const status = (['PAID', 'ISSUED', 'PARTIALLY_PAID', 'ISSUED', 'DRAFT'] as any)[i];
    const inv = await prisma.invoice.upsert({
      where: { invoiceNumber: `INV/2026/${String(i + 1).padStart(5, '0')}` },
      update: {},
      create: {
        labId, invoiceNumber: `INV/2026/${String(i + 1).padStart(5, '0')}`,
        customerId: customers[i].id, status, amount, taxAmount, totalAmount: total,
        issueDate: daysFromNow(-(5 - i)),
      },
    });
    if (status === 'PAID') await prisma.payment.create({ data: { invoiceId: inv.id, amount: total, method: 'NEFT' } });
    if (status === 'PARTIALLY_PAID') await prisma.payment.create({ data: { invoiceId: inv.id, amount: total / 2, method: 'Cheque' } });
  }

  // ── Environmental records (6) ──
  const envLocations = ['Dimensional Lab', 'Pressure Lab', 'Thermal Lab', 'Mass Lab', 'Electrical Lab', 'Mechanical Lab'];
  for (let i = 0; i < envLocations.length; i++) {
    await prisma.environmentalRecord.create({
      data: { labId, location: envLocations[i], temperature: 22.5 + i * 0.2, humidity: 48 + i, pressure: 101.2 + i * 0.05, operator: engineerSpecs[i % engineerSpecs.length].name, recordedAt: daysFromNow(-i) },
    });
  }

  // ── NCRs (5) + CAPA ──
  const ncrSpecs = [
    { ref: 'NCR-2026-001', desc: 'Reference standard STD-002 found overdue for calibration during internal check.', status: 'CLOSED' },
    { ref: 'NCR-2026-002', desc: 'Datasheet for JOB-2026-00002 missing environmental record entry.', status: 'OPEN' },
    { ref: 'NCR-2026-003', desc: 'Temperature in Thermal Lab exceeded 25 °C tolerance on 12 June.', status: 'IN_PROGRESS' },
    { ref: 'NCR-2026-004', desc: 'Customer complaint: certificate CC/2026/10004 had wrong unit printed.', status: 'CLOSED' },
    { ref: 'NCR-2026-005', desc: 'Balance intermediate check drift beyond control limit.', status: 'OPEN' },
  ];
  for (let i = 0; i < ncrSpecs.length; i++) {
    const n = ncrSpecs[i];
    const ncr = await prisma.nCR.upsert({
      where: { labId_reference: { labId, reference: n.ref } },
      update: {},
      create: { labId, reference: n.ref, description: n.desc, status: n.status, raisedById: adminUserId },
    });
    if (i % 2 === 0) {
      await prisma.cAPA.upsert({
        where: { ncrId: ncr.id },
        update: {},
        create: {
          ncrId: ncr.id, rootCause: 'Procedure not followed / overdue tracking gap.',
          correctiveAction: 'Recalibrated standard and reissued affected certificates.',
          preventiveAction: 'Automated recall reminders enabled 30/15/7 days before due.',
          status: n.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
        },
      });
    }
  }

  // ── Lab Documents (6) ──
  const docSpecs = [
    { docNumber: 'QM-01', title: 'Quality Manual', category: 'Policy', revision: '03' },
    { docNumber: 'SOP-CAL-01', title: 'SOP for Dimensional Calibration', category: 'SOP', revision: '02' },
    { docNumber: 'SOP-CAL-02', title: 'SOP for Pressure Gauge Calibration', category: 'SOP', revision: '01' },
    { docNumber: 'WI-TEMP-05', title: 'Work Instruction — Dry Block Operation', category: 'WI', revision: '00' },
    { docNumber: 'FRM-CERT-01', title: 'Calibration Certificate Format', category: 'Form', revision: '04' },
    { docNumber: 'EXT-NABL-126', title: 'NABL 126 Specific Criteria (External)', category: 'External', revision: '01' },
  ];
  for (const d of docSpecs) {
    await prisma.labDocument.create({
      data: {
        labId, docNumber: d.docNumber, title: d.title, category: d.category, revision: d.revision,
        status: 'ACTIVE', approvedBy: 'Lab Administrator', approvedAt: daysFromNow(-90),
        reviewDueAt: daysFromNow(275), content: `${d.title} — controlled document. Review annually.`,
      },
    });
  }

  // ── Internal Audits (5) + findings ──
  const auditSpecs = [
    { num: 'IA-2026-01', scope: 'Dimensional Calibration', status: 'COMPLETED', conducted: true },
    { num: 'IA-2026-02', scope: 'Pressure & Thermal', status: 'COMPLETED', conducted: true },
    { num: 'IA-2026-03', scope: 'Mass & Volume', status: 'IN_PROGRESS', conducted: false },
    { num: 'IA-2026-04', scope: 'Electrical Calibration', status: 'PLANNED', conducted: false },
    { num: 'IA-2026-05', scope: 'Document Control & Records', status: 'PLANNED', conducted: false },
  ];
  for (let i = 0; i < auditSpecs.length; i++) {
    const a = auditSpecs[i];
    await prisma.internalAudit.create({
      data: {
        labId, auditNumber: a.num, plannedDate: daysFromNow(-30 + i * 15),
        conductedDate: a.conducted ? daysFromNow(-28 + i * 15) : null,
        auditor: engineerSpecs[i % engineerSpecs.length].name, scope: a.scope, status: a.status,
        findings: a.conducted ? {
          create: [
            { clause: '6.4.3', category: i === 0 ? 'MINOR' : 'OBSERVATION', description: 'Equipment label faded on one master standard.', rootCause: 'Wear over time.', correction: 'Relabelled.', status: 'CLOSED', closedAt: daysFromNow(-20) },
            { clause: '7.8.4', category: 'OBSERVATION', description: 'Uncertainty budget could include drift term.', status: 'OPEN', dueDate: daysFromNow(20) },
          ],
        } : undefined,
      },
    });
  }

  // ── Notifications (6) ──
  const notifSpecs = [
    { event: 'JOB_CREATED', channel: 'IN_APP', payload: { jobNumber: 'JOB-2026-00001' } },
    { event: 'CERTIFICATE_ISSUED', channel: 'EMAIL', payload: { certificateNumber: 'CC/2026/10004' } },
    { event: 'CALIBRATION_DUE', channel: 'EMAIL', payload: { instrument: 'Pressure Gauge WK-553', dueIn: '7 days' } },
    { event: 'NCR_RAISED', channel: 'IN_APP', payload: { reference: 'NCR-2026-002' } },
    { event: 'INVOICE_ISSUED', channel: 'EMAIL', payload: { invoiceNumber: 'INV/2026/00002' } },
    { event: 'QUOTATION_ACCEPTED', channel: 'IN_APP', payload: { quoteNumber: 'QT-2026-00003' } },
  ];
  for (const n of notifSpecs) {
    await prisma.notification.create({
      data: { labId, userId: adminUserId, channel: n.channel, event: n.event, payload: n.payload as any, isRead: false },
    });
  }

  // ── Inventory items (6) — stored in Setting (matches inventory module) ──
  const invItems = [
    { name: 'Cleaning Tissue (lint-free)', category: 'Consumable', quantity: 50, location: 'Store A', unit: 'box' },
    { name: 'Calibration Oil (silicone)', category: 'Consumable', quantity: 12, location: 'Pressure Lab', unit: 'litre' },
    { name: 'Thermal Paste', category: 'Consumable', quantity: 8, location: 'Thermal Lab', unit: 'tube' },
    { name: 'Spare O-rings (pressure)', category: 'Spare', quantity: 100, location: 'Store B', unit: 'pcs' },
    { name: 'Distilled Water', category: 'Consumable', quantity: 20, location: 'Mass Lab', unit: 'litre' },
    { name: 'Anti-static Gloves', category: 'PPE', quantity: 30, location: 'Electrical Lab', unit: 'pair' },
  ];
  for (const it of invItems) {
    const id = randomUUID();
    await prisma.setting.create({
      data: { key: `inventory:${labId}:item:${id}`, value: { ...it, id, labId } as any },
    });
  }

  // ── Audit log entries (5) ──
  const auditActions = ['LOGIN', 'JOB_CREATE', 'CERTIFICATE_SIGN', 'CUSTOMER_CREATE', 'INVOICE_ISSUE'];
  for (const action of auditActions) {
    await prisma.auditLog.create({
      data: { labId, userId: adminUserId, action, entity: 'Demo', entityId: randomUUID() },
    });
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
