const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });
    
    console.log('📋 Users in database:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.username}) - ${user.firstName} ${user.lastName}`);
    });
    
    if (users.length === 0) {
      console.log('❌ NO USERS FOUND IN DATABASE');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
