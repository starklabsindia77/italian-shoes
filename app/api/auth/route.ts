import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'starklabs'; // Replace with a secure secret key

// POST handler for /api/auth
export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                roles: { include: { role: true } }, // Include roles for role-based authentication
            },
        });

        // Handle user not found
        if (!user) {
            return NextResponse.json(
                { message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Compare provided password with stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                roles: user.roles.map((role: { role: { name: any; }; }) => role.role.name), // Include roles in payload
            },
            JWT_SECRET,
            { expiresIn: '1h' } // Token validity
        );

        // Return success response
        return NextResponse.json(
            {
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    roles: user.roles.map((role: { role: { name: any; }; }) => role.role.name),
                    firstName: user.firstName,
                    lastName: user.lastName,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error during login:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
