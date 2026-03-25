// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * NextAuth configuration
 * - Credentials login (email/password)
 * - JWT sessions with role in token & session
 * - Sign-in page at /login
 */
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET, // ensure set in .env
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      // Return `null` to reject, or a minimal user object to accept.
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";

        if (!email || !password) {
          console.warn("auth/missing-credentials");
          return null;
        }

        const user = await (prisma.user as any).findUnique({ 
          where: { email },
          include: { customRole: true }
        });
        if (!user) {
          console.warn("auth/no-user", email);
          return null;
        }
        if (!user.isActive) {
          console.warn("auth/user-inactive", email);
          return null;
        }
        if (!user.passwordHash) {
          console.warn("auth/no-password", email);
          return null;
        }

        const ok = await compare(password, user.passwordHash);
        if (!ok) {
          console.warn("auth/bad-password", email);
          return null;
        }

        // This object becomes `user` in the `jwt` callback (on first sign-in)
        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email,
          role: user.role,
          permissions: (user as any).customRole?.permissions || [],
        } as any;
      },
    }),
  ],
  callbacks: {
    // Runs on initial sign-in (with `user`) and on every subsequent request (without `user`)
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? "USER";
        token.permissions = (user as any).permissions ?? [];
      } else if (token?.email) {
        // Fetch fresh data from DB on every token check to ensure permissions are up to date
        // This solves the latency issue when an Admin modifies a user's role/permissions
        try {
          const dbUser = await (prisma.user as any).findUnique({
            where: { email: token.email as string },
            select: { role: true, customRole: { select: { permissions: true } } },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.permissions = (dbUser as any).customRole?.permissions ?? [];
          }
        } catch (e) {
          console.error("JWT sync error:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub as string;
        (session.user as any).role = (token as any).role ?? "USER";
        (session.user as any).permissions = (token as any).permissions ?? [];
      }
      return session;
    },
  },
};

/** Convenience helper to read the server session with our options */
export const getServerAuthSession = () => getServerSession(authOptions);

/** Throw if not signed in; returns the session otherwise */
export async function requireUser() {
  const session = await getServerAuthSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

/** Throw if not ADMIN; returns the session otherwise */
export async function requireAdmin() {
  const session = await getServerAuthSession();
  if (!session || (session.user as any).role !== "ADMIN") {
    throw Object.assign(new Error("Unauthorized"), { code: 401 });
  }
  return session;
}

/** Throw if the user does not have one of the required roles */
export async function requireAnyRole(roles: string[]) {
  const session = await getServerAuthSession();
  if (!session || !roles.includes((session.user as any).role)) {
    throw Object.assign(new Error("Forbidden"), { code: 403 });
  }
  return session;
}

export async function auth() {
  return getServerAuthSession();
}
