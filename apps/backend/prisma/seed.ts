import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Nettoyer les données existantes
  await prisma.session.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.user.deleteMany();

  // Utilisateur admin
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@starred-sardine.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Starred Sardine',
      role: 'ADMIN',
      isEmailVerified: true,
      subscriptionStatus: 'PREMIUM'
    }
  });

  // Utilisateur test vérifié
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.create({
    data: {
      email: 'user@test.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      isEmailVerified: true,
      subscriptionStatus: 'FREE'
    }
  });

  // Utilisateur premium
  const premiumPassword = await bcrypt.hash('premium123', 12);
  const premiumUser = await prisma.user.create({
    data: {
      email: 'premium@test.com',
      password: premiumPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'USER',
      isEmailVerified: true,
      subscriptionStatus: 'PREMIUM'
    }
  });

  // Utilisateur non vérifié (pour tester les emails)
  const unverifiedPassword = await bcrypt.hash('unverified123', 12);
  const unverifiedUser = await prisma.user.create({
    data: {
      email: 'unverified@test.com',
      password: unverifiedPassword,
      firstName: 'Bob',
      lastName: 'Wilson',
      role: 'USER',
      isEmailVerified: false,
      emailVerificationToken: 'test-token-123'
    }
  });

  console.log('✅ Seeding terminé !');
  console.log('');
  console.log('👥 Utilisateurs créés :');
  console.log('🔐 Admin: admin@starred-sardine.com / admin123');
  console.log('👤 User: user@test.com / user123');
  console.log('💎 Premium: premium@test.com / premium123');
  console.log('❌ Non vérifié: unverified@test.com / unverified123');
  console.log('');
  console.log('🚀 Tu peux maintenant te connecter avec ces comptes !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
