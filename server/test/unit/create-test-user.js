const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash the password 'password'
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // Create the test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    });
    
    console.log('✅ Test user created successfully:', user);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ User already exists');
    } else {
      console.error('❌ Error creating test user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
