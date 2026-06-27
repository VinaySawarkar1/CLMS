import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class SeedService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDemo(labId: string) {
    // Idempotency check
    const existing = await this.prisma.customer.findFirst({
      where: { labId, name: 'Tata Motors Ltd' },
    });
    if (existing) {
      return { message: 'Sample data already loaded' };
    }

    const now = new Date();
    const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

    // ── 1. Customers ──────────────────────────────────────────────────
    const customerData = [
      { code: 'CUST-001', name: 'Tata Motors Ltd', gstin: '27AAACT2727Q1ZW', email: 'quality@tatamotors.com', phone: '+91-20-66049999', address: 'Sanand Plant, Gujarat' },
      { code: 'CUST-002', name: 'Mahindra Engineering', gstin: '27AAACM4085R1ZZ', email: 'metrology@mahindra.com', phone: '+91-22-24904444', address: 'Kandivali East, Mumbai' },
      { code: 'CUST-003', name: 'Bharat Electronics Ltd', gstin: '29AAACB1432H1Z5', email: 'cal@bel-india.in', phone: '+91-80-22190100', address: 'Jalahalli, Bengaluru' },
      { code: 'CUST-004', name: 'Indian Oil Corporation', gstin: '07AAACI1681G1ZF', email: 'instrumentation@iocl.com', phone: '+91-11-26268285', address: 'G-9, Ali Yavar Jung Marg, Delhi' },
      { code: 'CUST-005', name: 'ISRO Satellite Centre', gstin: '29AAAAI0001A1Z0', email: 'standards@isac.gov.in', phone: '+91-80-22172494', address: 'HAL Airport Road, Bengaluru' },
    ];
    const customers = await Promise.all(
      customerData.map((c) => this.prisma.customer.create({ data: { labId, ...c } })),
    );

    // ── 2. Instruments ────────────────────────────────────────────────
    const instrumentData = [
      { customerId: customers[0].id, name: 'Vernier Caliper', make: 'Mitutoyo', model: '530-119', serialNumber: 'VC-20240101', range: '0-300 mm', unit: 'mm', leastCount: '0.02 mm', idNumber: 'INS-001' },
      { customerId: customers[1].id, name: 'Outside Micrometer', make: 'Mitutoyo', model: '103-215', serialNumber: 'MIC-20240102', range: '0-25 mm', unit: 'mm', leastCount: '0.001 mm', idNumber: 'INS-002' },
      { customerId: customers[2].id, name: 'Pressure Gauge', make: 'Wika', model: 'EN 837-1', serialNumber: 'PG-20240103', range: '0-10 bar', unit: 'bar', leastCount: '0.1 bar', idNumber: 'INS-003' },
      { customerId: customers[3].id, name: 'Temperature Sensor', make: 'Fluke', model: '52-II', serialNumber: 'TS-20240104', range: '-200 to 1372°C', unit: '°C', leastCount: '0.1°C', idNumber: 'INS-004' },
      { customerId: customers[4].id, name: 'Weighing Scale', make: 'Mettler Toledo', model: 'ML303E', serialNumber: 'WS-20240105', range: '0-320 g', unit: 'g', leastCount: '0.001 g', idNumber: 'INS-005' },
    ];
    const instruments = await Promise.all(
      instrumentData.map((i) => this.prisma.instrument.create({ data: { labId, ...i } })),
    );

    // ── 3. Master Instruments ─────────────────────────────────────────
    const masterData = [
      { name: 'Reference Length Bar', idNumber: 'MST-001', serialNumber: 'RLB-001', make: 'NPL', model: 'Grade-1', calibratedDate: addDays(now, -180), calibrationDue: addDays(now, 185), uncertainty: '±0.5 µm', traceability: 'NABL/NPL/PTB' },
      { name: 'Dead Weight Tester', idNumber: 'MST-002', serialNumber: 'DWT-001', make: 'Budenberg', model: '580EH', calibratedDate: addDays(now, -90), calibrationDue: addDays(now, 275), uncertainty: '±0.02% FS', traceability: 'NABL/NML/BIPM' },
      { name: 'Precision Thermometer', idNumber: 'MST-003', serialNumber: 'PT-001', make: 'Fluke', model: '1502A', calibratedDate: addDays(now, -120), calibrationDue: addDays(now, 245), uncertainty: '±0.05°C', traceability: 'NABL/NPL' },
      { name: 'Standard Masses E2', idNumber: 'MST-004', serialNumber: 'SM-001', make: 'Kern', model: 'E2-500g', calibratedDate: addDays(now, -60), calibrationDue: addDays(now, 305), uncertainty: '±0.030 mg', traceability: 'NABL/NML/BIPM' },
      { name: 'Digital Multimeter Reference', idNumber: 'MST-005', serialNumber: 'DMM-001', make: 'Fluke', model: '8508A', calibratedDate: addDays(now, -150), calibrationDue: addDays(now, 215), uncertainty: '±3 ppm', traceability: 'NABL/NPLI' },
    ];
    await Promise.all(
      masterData.map((m) => this.prisma.masterInstrument.create({ data: { labId, ...m } })),
    );

    // ── 4. Jobs ───────────────────────────────────────────────────────
    const jobData = [
      { jobNumber: 'JOB-2024-001', customerId: customers[0].id, instrumentId: instruments[0].id, challanNo: 'DC-001', conditionOfItem: 'OK (As Received)', dueDate: addDays(now, 7) },
      { jobNumber: 'JOB-2024-002', customerId: customers[1].id, instrumentId: instruments[1].id, challanNo: 'DC-002', conditionOfItem: 'OK (As Received)', dueDate: addDays(now, 5) },
      { jobNumber: 'JOB-2024-003', customerId: customers[2].id, instrumentId: instruments[2].id, challanNo: 'DC-003', conditionOfItem: 'OK (As Received)', dueDate: addDays(now, 10) },
      { jobNumber: 'JOB-2024-004', customerId: customers[3].id, instrumentId: instruments[3].id, challanNo: 'DC-004', conditionOfItem: 'OK (As Received)', dueDate: addDays(now, 3) },
      { jobNumber: 'JOB-2024-005', customerId: customers[4].id, instrumentId: instruments[4].id, challanNo: 'DC-005', conditionOfItem: 'OK (As Received)', dueDate: addDays(now, 14) },
    ];
    await Promise.all(
      jobData.map((j) => this.prisma.job.create({ data: { labId, status: 'RECEIVED', ...j } })),
    );

    // ── 5. Tasks ──────────────────────────────────────────────────────
    const taskData = [
      { title: 'Calibrate Vernier Caliper', description: 'Perform full dimensional calibration per SOP-CAL-001', status: 'TODO' },
      { title: 'Review Datasheet JOB-2024-002', description: 'Review and sign off datasheet for micrometer calibration', status: 'TODO' },
      { title: 'Update SOPs to Rev 03', description: 'Incorporate latest NABL Doc-17 changes into calibration procedures', status: 'TODO' },
      { title: 'Internal Audit Preparation', description: 'Prepare checklist and evidence files for upcoming internal audit', status: 'TODO' },
      { title: 'Certificate Review Batch', description: 'Review and approve pending calibration certificates', status: 'TODO' },
    ];
    await Promise.all(
      taskData.map((t) => this.prisma.task.create({ data: { labId, ...t } })),
    );

    // ── 6. Environmental Records ──────────────────────────────────────
    const envData = [
      { location: 'Main Calibration Lab', temperature: 22.1, humidity: 48.5, pressure: 101.3, operator: 'System' },
      { location: 'Dimensional Lab', temperature: 23.0, humidity: 50.2, pressure: 101.2, operator: 'System' },
      { location: 'Pressure Lab', temperature: 24.5, humidity: 52.0, pressure: 101.4, operator: 'System' },
      { location: 'Thermal Lab', temperature: 22.8, humidity: 46.8, pressure: 101.3, operator: 'System' },
      { location: 'Mass Lab', temperature: 23.5, humidity: 53.1, pressure: 101.1, operator: 'System' },
    ];
    await Promise.all(
      envData.map((e) => this.prisma.environmentalRecord.create({ data: { labId, ...e } })),
    );

    // ── 7. Quotations ─────────────────────────────────────────────────
    const quotationData = [
      { quoteNumber: 'QUO-2024-001', customerId: customers[0].id, amount: 5000, taxRate: 18, taxAmount: 900, totalAmount: 5900, items: JSON.stringify([{ description: 'Vernier Caliper Calibration', qty: 1, rate: 5000 }]) },
      { quoteNumber: 'QUO-2024-002', customerId: customers[1].id, amount: 3500, taxRate: 18, taxAmount: 630, totalAmount: 4130, items: JSON.stringify([{ description: 'Micrometer Calibration', qty: 1, rate: 3500 }]) },
      { quoteNumber: 'QUO-2024-003', customerId: customers[2].id, amount: 7500, taxRate: 18, taxAmount: 1350, totalAmount: 8850, items: JSON.stringify([{ description: 'Pressure Gauge Calibration', qty: 1, rate: 7500 }]) },
      { quoteNumber: 'QUO-2024-004', customerId: customers[3].id, amount: 4200, taxRate: 18, taxAmount: 756, totalAmount: 4956, items: JSON.stringify([{ description: 'Temperature Sensor Calibration', qty: 1, rate: 4200 }]) },
      { quoteNumber: 'QUO-2024-005', customerId: customers[4].id, amount: 6800, taxRate: 18, taxAmount: 1224, totalAmount: 8024, items: JSON.stringify([{ description: 'Weighing Scale Calibration', qty: 1, rate: 6800 }]) },
    ];
    await Promise.all(
      quotationData.map((q) =>
        this.prisma.quotation.create({
          data: { labId, status: 'DRAFT', ...q, items: JSON.parse(q.items) },
        }),
      ),
    );

    // ── 8. Invoices ───────────────────────────────────────────────────
    const invoiceData = [
      { invoiceNumber: 'INV-2024-001', customerId: customers[0].id, amount: 5000, taxAmount: 900, totalAmount: 5900 },
      { invoiceNumber: 'INV-2024-002', customerId: customers[1].id, amount: 3500, taxAmount: 630, totalAmount: 4130 },
      { invoiceNumber: 'INV-2024-003', customerId: customers[2].id, amount: 7500, taxAmount: 1350, totalAmount: 8850 },
      { invoiceNumber: 'INV-2024-004', customerId: customers[3].id, amount: 4200, taxAmount: 756, totalAmount: 4956 },
      { invoiceNumber: 'INV-2024-005', customerId: customers[4].id, amount: 6800, taxAmount: 1224, totalAmount: 8024 },
    ];
    await Promise.all(
      invoiceData.map((inv) =>
        this.prisma.invoice.create({ data: { labId, status: 'DRAFT', issueDate: now, ...inv } }),
      ),
    );

    // ── 9. Purchase Orders ────────────────────────────────────────────
    const poData = [
      { poNumber: 'PO-2024-001', supplierId: customers[0].id, totalAmount: 12500, status: 'APPROVED', lineItems: [{ description: 'Vernier Caliper Reference Grade', qty: 1, rate: 12500 }] },
      { poNumber: 'PO-2024-002', supplierId: customers[1].id, totalAmount: 45000, status: 'PENDING_APPROVAL', lineItems: [{ description: 'Precision Thermometer 1502A', qty: 1, rate: 45000 }] },
      { poNumber: 'PO-2024-003', supplierId: customers[2].id, totalAmount: 28000, status: 'DRAFT', lineItems: [{ description: 'Calibration Weight Set E2 500g', qty: 2, rate: 14000 }] },
      { poNumber: 'PO-2024-004', supplierId: customers[3].id, totalAmount: 18000, status: 'APPROVED', lineItems: [{ description: 'Dead Weight Tester Accessories', qty: 1, rate: 18000 }] },
      { poNumber: 'PO-2024-005', supplierId: customers[4].id, totalAmount: 5500, status: 'DRAFT', lineItems: [{ description: 'Certificate Paper A4 Premium', qty: 10, rate: 550 }] },
    ];
    await Promise.all(
      poData.map((p) =>
        this.prisma.purchaseOrder.create({ data: { labId, ...p } }),
      ),
    );

    // ── 10. Delivery Challans ─────────────────────────────────────────
    const challanData = [
      { challanNumber: 'DC-2024-001', customerId: customers[0].id, challanType: 'OUTWARD', status: 'DISPATCHED', vehicleNumber: 'MH-04-AB-1234', driverName: 'Ramesh Kumar', transporterName: 'Blue Dart Logistics' },
      { challanNumber: 'DC-2024-002', customerId: customers[1].id, challanType: 'INWARD', status: 'RECEIVED', vehicleNumber: 'MH-02-CD-5678', driverName: 'Suresh Patil', transporterName: 'DTDC Courier' },
      { challanNumber: 'DC-2024-003', customerId: customers[2].id, challanType: 'OUTWARD', status: 'DRAFT', vehicleNumber: '', driverName: '', transporterName: 'Self Pickup' },
      { challanNumber: 'DC-2024-004', customerId: customers[3].id, challanType: 'OUTWARD', status: 'DISPATCHED', vehicleNumber: 'DL-01-EF-9012', driverName: 'Vijay Singh', transporterName: 'FedEx India' },
      { challanNumber: 'DC-2024-005', customerId: customers[4].id, challanType: 'INWARD', status: 'DRAFT', vehicleNumber: 'KA-03-GH-3456', driverName: 'Arjun Nair', transporterName: 'Delhivery' },
    ];
    await Promise.all(
      challanData.map((c) =>
        this.prisma.deliveryChallan.create({ data: { labId, ...c } }),
      ),
    );

    // ── 11. Leads / Pipeline ──────────────────────────────────────────
    const leadData = [
      { title: 'Annual Calibration Contract - Ashok Leyland', companyName: 'Ashok Leyland Ltd', contactName: 'Mr. Venkat Rao', contactEmail: 'venkat@ashokleyland.com', contactPhone: '+91-44-24763000', stage: 'PROPOSAL', value: 250000, source: 'REFERRAL', probability: 70 },
      { title: 'New Lab Setup Consultation - DRDO', companyName: 'DRDO Hyderabad', contactName: 'Dr. Meera Krishnan', contactEmail: 'meera@drdo.gov.in', contactPhone: '+91-40-23045678', stage: 'NEGOTIATION', value: 500000, source: 'OTHER', probability: 60 },
      { title: 'Pressure Lab Instruments - Larsen & Toubro', companyName: 'L&T Engineering', contactName: 'Mr. Raj Sharma', contactEmail: 'raj.sharma@lnteng.com', contactPhone: '+91-22-67525656', stage: 'QUALIFIED', value: 180000, source: 'COLD_CALL', probability: 40 },
      { title: 'ISO 17025 Audit Support - Bosch India', companyName: 'Bosch India Ltd', contactName: 'Ms. Priya Nambiar', contactEmail: 'priya.nambiar@bosch.in', contactPhone: '+91-80-22991111', stage: 'CONTACTED', value: 120000, source: 'WEBSITE', probability: 25 },
      { title: 'Mass Calibration Services - Cipla Ltd', companyName: 'Cipla Pharmaceuticals', contactName: 'Mr. Amit Desai', contactEmail: 'amit.desai@cipla.com', contactPhone: '+91-22-23082891', stage: 'WON', value: 95000, source: 'EXHIBITION', probability: 100 },
    ];
    await Promise.all(
      leadData.map((l) =>
        this.prisma.lead.create({ data: { labId, ...l } }),
      ),
    );

    // ── 12. CRM Activities ────────────────────────────────────────────
    const activityData = [
      { type: 'CALL', title: 'Follow-up call on calibration contract renewal', customerId: customers[0].id, isDone: true, outcome: 'Customer confirmed renewal. Sending revised quote.' },
      { type: 'EMAIL', title: 'Sent updated quotation QUO-2024-002 to Mahindra', customerId: customers[1].id, isDone: true, outcome: 'Attached PDF quote with NABL certificate samples.' },
      { type: 'MEETING', title: 'On-site visit to BEL Bangalore facility', customerId: customers[2].id, isDone: false, dueDate: addDays(now, 5), description: 'Meeting with QA team to discuss scope of calibration.' },
      { type: 'TASK', title: 'Certificate portal demo for IOCL team', customerId: customers[3].id, isDone: false, dueDate: addDays(now, 3), description: 'Show online certificate verification and customer portal.' },
      { type: 'NOTE', title: 'Follow up on ISRO annual contract', customerId: customers[4].id, isDone: false, dueDate: addDays(now, 10), description: 'Awaiting purchase order from procurement.' },
    ];
    await Promise.all(
      activityData.map((a) =>
        this.prisma.crmActivity.create({ data: { labId, ...a } }),
      ),
    );

    // ── 14. Inventory Items (stored in Setting table) ──────────────────
    const inventoryItems = [
      { id: randomUUID(), name: 'E2 Calibration Weights Set', category: 'Mass Standards', quantity: 3, location: 'Mass Lab Cabinet A' },
      { id: randomUUID(), name: 'Reference Pressure Gauge', category: 'Pressure Standards', quantity: 2, location: 'Pressure Lab' },
      { id: randomUUID(), name: 'PRT Thermometer Reference', category: 'Thermal Standards', quantity: 2, location: 'Thermal Lab' },
      { id: randomUUID(), name: 'Humidity Sensor SHT35', category: 'Environmental Sensors', quantity: 5, location: 'Main Lab' },
      { id: randomUUID(), name: 'Pressure Standard 700 bar', category: 'Pressure Standards', quantity: 1, location: 'Pressure Lab' },
    ];
    await Promise.all(
      inventoryItems.map((item) =>
        this.prisma.setting.upsert({
          where: { key: `inventory:${labId}:item:${item.id}` },
          create: { key: `inventory:${labId}:item:${item.id}`, value: { ...item, labId } },
          update: { value: { ...item, labId } },
        }),
      ),
    );

    // ── 15. NCRs ──────────────────────────────────────────────────────
    const ncrData = [
      { reference: 'NCR-2024-001', description: 'Calibration certificate issued without required signatures — missing Technical Manager sign-off on 3 certificates.', status: 'OPEN' },
      { reference: 'NCR-2024-002', description: 'Environmental temperature exceeded 25°C for 45 minutes during calibration session on 2024-06-10.', status: 'OPEN' },
      { reference: 'NCR-2024-003', description: 'Reference standard MST-003 used beyond calibration due date by 2 days.', status: 'OPEN' },
      { reference: 'NCR-2024-004', description: 'Datasheet for JOB-2024-001 missing uncertainty budget calculation.', status: 'OPEN' },
      { reference: 'NCR-2024-005', description: 'Customer complaint: certificate delivery delayed beyond committed 3 working days.', status: 'OPEN' },
    ];
    await Promise.all(
      ncrData.map((n) => this.prisma.nCR.create({ data: { labId, ...n } })),
    );

    // ── 16. Lab Documents ─────────────────────────────────────────────
    const docData = [
      { docNumber: 'SOP-CAL-001', title: 'Calibration Procedure for Dimensional Instruments', category: 'SOP', revision: '02', status: 'ACTIVE' },
      { docNumber: 'SOP-CAL-002', title: 'Calibration Procedure for Pressure Gauges', category: 'SOP', revision: '01', status: 'ACTIVE' },
      { docNumber: 'SOP-CAL-003', title: 'Calibration Procedure for Temperature Instruments', category: 'SOP', revision: '03', status: 'ACTIVE' },
      { docNumber: 'SOP-QMS-001', title: 'Document Control and Management Procedure', category: 'SOP', revision: '02', status: 'ACTIVE' },
      { docNumber: 'SOP-ENV-001', title: 'Environmental Monitoring and Control Procedure', category: 'SOP', revision: '01', status: 'ACTIVE' },
    ];
    await Promise.all(
      docData.map((d) => this.prisma.labDocument.create({ data: { labId, ...d } })),
    );

    // ── 17. Internal Audits ───────────────────────────────────────────
    const auditData = [
      { auditNumber: 'IA-2024-01', plannedDate: addDays(now, 30), auditor: 'Quality Manager', scope: 'Calibration Process and Certificate Issuance', status: 'PLANNED' },
      { auditNumber: 'IA-2024-02', plannedDate: addDays(now, 60), auditor: 'Technical Manager', scope: 'Reference Standards and Traceability', status: 'PLANNED' },
      { auditNumber: 'IA-2024-03', plannedDate: addDays(now, 90), auditor: 'External Auditor', scope: 'Document Control and Records Management', status: 'PLANNED' },
      { auditNumber: 'IA-2024-04', plannedDate: addDays(now, 120), auditor: 'Quality Manager', scope: 'Environmental Monitoring and Facility', status: 'PLANNED' },
      { auditNumber: 'IA-2024-05', plannedDate: addDays(now, 150), auditor: 'Lab Admin', scope: 'Full System Audit — ISO/IEC 17025 Compliance', status: 'PLANNED' },
    ];
    await Promise.all(
      auditData.map((a) => this.prisma.internalAudit.create({ data: { labId, ...a } })),
    );

    return {
      message: 'Sample data loaded successfully',
      counts: {
        customers: 5, instruments: 5, masterInstruments: 5,
        jobs: 5, tasks: 5, environmentalRecords: 5,
        quotations: 5, invoices: 5,
        purchaseOrders: 5, deliveryChallans: 5,
        leads: 5, crmActivities: 5,
        inventoryItems: 5, ncrs: 5,
        documents: 5, internalAudits: 5,
      },
    };
  }
}
