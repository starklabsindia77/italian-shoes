import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  const adminEmail = 'admin@example.com';
  const plainPassword = 'admin@123';
  
  // Hash the password securely
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

  try {
    // Check if the admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      // Create dummy admin user
      const adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          isActive: true,
          roles: {
            create: [
              {
                role: {
                  create: {
                    name: 'admin',
                    description: 'Administrator role with all permissions',
                  },
                },
              },
            ],
          },
        },
        include: {
          roles: { include: { role: true } },
        },
      });

      console.log('Admin user created successfully:', adminUser);
    } else {
      console.log('Admin user already exists:', existingAdmin);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
