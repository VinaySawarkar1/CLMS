import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DISCIPLINES = [
  'Mechanical', 'Electrical', 'Pressure', 'Temperature', 'Mass', 'Dimension',
  'Flow', 'Volume', 'Force', 'Torque', 'Humidity', 'RPM', 'Time Frequency',
  'Acoustics',
];

async function main() {
  // Seed a Super Admin
  const email = 'admin@clms.local';
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      fullName: 'System Administrator',
      role: 'SUPER_ADMIN',
    },
  });

  // Seed disciplines
  for (const name of DISCIPLINES) {
    const code = name.replace(/\s+/g, '_').toUpperCase();
    await prisma.discipline.upsert({
      where: { code },
      update: {},
      create: { name, code },
    });
  }

  // Demo data — created once (only when there are no jobs yet) so it is safe
  // to run on every deploy and never duplicates or overwrites real data.
  const jobCount = await prisma.job.count();
  if (jobCount === 0) {
    const cust = await prisma.customer.upsert({
      where: { code: 'CUST-001' },
      update: {},
      create: {
        code: 'CUST-001', name: 'Precision Tools Pvt. Ltd.',
        gstin: '27ABCDE1234F1Z5', email: 'qa@precisiontools.in', phone: '+91-9800000001',
      },
    });
    await prisma.customer.upsert({
      where: { code: 'CUST-002' },
      update: {},
      create: { code: 'CUST-002', name: 'Acme Instruments', email: 'lab@acme.in' },
    });

    const caliper = await prisma.instrument.create({
      data: {
        customerId: cust.id, name: 'Digital Vernier Caliper', make: 'Mitutoyo',
        model: 'CD-6ASX', serialNumber: 'MT-100245', range: '0-150 mm', leastCount: '0.01 mm',
      },
    });
    const gauge = await prisma.instrument.create({
      data: {
        customerId: cust.id, name: 'Pressure Gauge', make: 'Wika',
        model: '232.50', serialNumber: 'WK-553', range: '0-25 bar',
      },
    });

    const engUser = await prisma.user.upsert({
      where: { email: 'r.kumar@clms.local' },
      update: {},
      create: {
        email: 'r.kumar@clms.local',
        passwordHash: await bcrypt.hash('engineer123', 10),
        fullName: 'R. Kumar', role: 'CALIBRATION_ENGINEER',
      },
    });
    const eng = await prisma.engineer.upsert({
      where: { employeeCode: 'ENG-001' },
      update: {},
      create: { userId: engUser.id, employeeCode: 'ENG-001', skills: ['Dimension', 'Pressure'] },
    });

    await prisma.job.create({
      data: { jobNumber: 'JOB-2026-00001', customerId: cust.id, instrumentId: caliper.id, status: 'RECEIVED' },
    });
    await prisma.job.create({
      data: { jobNumber: 'JOB-2026-00002', customerId: cust.id, instrumentId: gauge.id, engineerId: eng.id, status: 'IN_CALIBRATION' },
    });
    await prisma.job.create({
      data: { jobNumber: 'JOB-2026-00003', customerId: cust.id, instrumentId: caliper.id, engineerId: eng.id, status: 'APPROVED' },
    });

    await prisma.task.create({ data: { title: 'Calibrate caliper MT-100245', engineerId: eng.id, status: 'RUNNING' } });
    await prisma.task.create({ data: { title: 'Review pressure gauge datasheet', status: 'REVIEW' } });

    // eslint-disable-next-line no-console
    console.log('Demo data seeded: 2 customers, 2 instruments, 1 engineer, 3 jobs, 2 tasks');
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete. Login: admin@clms.local / admin123');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
