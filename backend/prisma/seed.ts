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
