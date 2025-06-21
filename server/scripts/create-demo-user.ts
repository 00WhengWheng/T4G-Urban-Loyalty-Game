import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@t4g.com' }
    });

    if (existingUser) {
      console.log('Demo user already exists!');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('demo123', 10);

    // Create demo user
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@t4g.com',
        username: 'demo',
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'User',
        totalPoints: 1000,
        level: 5,
        status: 'ACTIVE'
      }
    });

    console.log('Demo user created successfully:', {
      id: demoUser.id,
      email: demoUser.email,
      username: demoUser.username
    });

  } catch (error) {
    console.error('Error creating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();
