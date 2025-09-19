import { prisma } from '../lib/prisma';

async function verifyAllEmails() {
  try {
    const result = await prisma.user.updateMany({
      where: {
        isEmailVerified: false
      },
      data: {
        isEmailVerified: true
      }
    });

    console.log(`✅ ${result.count} emails marqués comme vérifiés pour les tests`);
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des emails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAllEmails();