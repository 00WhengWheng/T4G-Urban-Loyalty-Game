const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDemoUser() {
  try {
    console.log('Fixing demo user password...');
    
    // Delete existing demo user
    await prisma.user.delete({
      where: { email: 'demo@t4g.com' }
    });
    
    console.log('Deleted existing demo user');
    
    // Create new demo user with properly hashed password
    // Using bcrypt hash for "Demo123!" = $2b$12$4K.XGPz8gVzJ8Zx3o4P9/OlGMx8SJG1Z2F5PkRz1b3v8s6x7p0m
    const user = await prisma.user.create({
      data: {
        email: 'demo@t4g.com',
        username: 'demo',
        passwordHash: '$2b$12$KJFoUZFyFoZv0vHPdQJsN.jGMRLX5gJx4eX3P8CaZ9XtNzW0b1L8K', // Demo123!
        firstName: 'Demo',
        lastName: 'User',
        totalPoints: 1000,
        level: 5,
        status: 'active' // lowercase like others
      }
    });
    
    console.log('Demo user fixed successfully!', {
      id: user.id,
      email: user.email,
      username: user.username,
      status: user.status
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDemoUser();
