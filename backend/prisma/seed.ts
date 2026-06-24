import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DISCIPLINES = [
  'Mechanical', 'Electrical', 'Pressure', 'Temperature', 'Mass', 'Dimension',
  'Flow', 'Volume', 'Force', 'Torque', 'Humidity', 'RPM', 'Time Frequency', 'Acoustics',
];

const ALL_PERMISSION_KEYS = [
  'customers', 'instruments', 'jobs', 'certificates', 'billing',
  'tasks', 'engineers', 'inventory', 'environmental', 'quality', 'audit', 'notifications',
];

// Default permissions per role (LAB_ADMIN can override these)
const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  TECHNICAL_MANAGER: ALL_PERMISSION_KEYS,
  CALIBRATION_ENGINEER: ['customers', 'instruments', 'jobs', 'certificates', 'tasks', 'environmental'],
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

  // 3. Demo Lab + data (only when no labs exist)
  const labCount = await prisma.lab.count();
  if (labCount === 0) {
    const demoLab = await prisma.lab.create({
      data: {
        name: 'Demo Calibration Laboratory',
        accreditationNumber: 'CC-3456',
        address: '123 Precision Road, Mumbai 400001',
        contactEmail: 'lab@democalib.in',
        status: 'APPROVED',
      },
    });

    // Lab Admin
    const labAdminEmail = 'labadmin@democalib.in';
    await prisma.user.upsert({
      where: { email: labAdminEmail },
      update: {},
      create: {
        email: labAdminEmail,
        passwordHash: await bcrypt.hash('labadmin123', 10),
        fullName: 'Lab Administrator',
        role: 'LAB_ADMIN',
        labId: demoLab.id,
      },
    });

    // Seed default permissions for this lab
    await seedPermissions(demoLab.id);

    // Customers
    const cust = await prisma.customer.create({
      data: {
        labId: demoLab.id,
        code: 'CUST-001',
        name: 'Precision Tools Pvt. Ltd.',
        gstin: '27ABCDE1234F1Z5',
        email: 'qa@precisiontools.in',
        phone: '+91-9800000001',
      },
    });
    await prisma.customer.create({
      data: { labId: demoLab.id, code: 'CUST-002', name: 'Acme Instruments', email: 'lab@acme.in' },
    });

    // Instruments
    const caliper = await prisma.instrument.create({
      data: {
        labId: demoLab.id, customerId: cust.id,
        name: 'Digital Vernier Caliper', make: 'Mitutoyo',
        model: 'CD-6ASX', serialNumber: 'MT-100245', range: '0-150 mm', leastCount: '0.01 mm', unit: 'mm',
      },
    });
    const gauge = await prisma.instrument.create({
      data: {
        labId: demoLab.id, customerId: cust.id,
        name: 'Pressure Gauge', make: 'Wika',
        model: '232.50', serialNumber: 'WK-553', range: '0-25 bar', unit: 'bar',
      },
    });

    // Engineer
    const engUser = await prisma.user.create({
      data: {
        email: 'r.kumar@democalib.in',
        passwordHash: await bcrypt.hash('engineer123', 10),
        fullName: 'R. Kumar',
        role: 'CALIBRATION_ENGINEER',
        labId: demoLab.id,
      },
    });
    const eng = await prisma.engineer.create({
      data: { userId: engUser.id, employeeCode: 'ENG-001', skills: ['Dimension', 'Pressure'] },
    });

    // Jobs
    await prisma.job.create({
      data: { labId: demoLab.id, jobNumber: 'JOB-2026-00001', customerId: cust.id, instrumentId: caliper.id, status: 'RECEIVED' },
    });
    await prisma.job.create({
      data: { labId: demoLab.id, jobNumber: 'JOB-2026-00002', customerId: cust.id, instrumentId: gauge.id, engineerId: eng.id, status: 'IN_CALIBRATION' },
    });
    await prisma.job.create({
      data: { labId: demoLab.id, jobNumber: 'JOB-2026-00003', customerId: cust.id, instrumentId: caliper.id, engineerId: eng.id, status: 'APPROVED' },
    });

    // Tasks
    await prisma.task.create({ data: { labId: demoLab.id, title: 'Calibrate caliper MT-100245', engineerId: eng.id, status: 'RUNNING' } });
    await prisma.task.create({ data: { labId: demoLab.id, title: 'Review pressure gauge datasheet', status: 'REVIEW' } });

    console.log('Demo lab seeded. Login: labadmin@democalib.in / labadmin123');
  }

  console.log('Seed complete.');
  console.log('Super Admin: admin@clms.local / admin123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
