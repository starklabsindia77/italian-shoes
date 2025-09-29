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

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          console.warn("auth/no-user", email);
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
          role: user.role, // "ADMIN" | "USER"
        } as any;
      },
    }),
  ],
  callbacks: {
    // Runs on initial sign-in (with `user`) and on every subsequent request (without `user`)
    async jwt({ token, user }) {
      if (user) {
        // first sign-in: copy role from `authorize`
        token.role = (user as any).role ?? "USER";
      } else {
        // subsequent requests: ensure token.role stays in sync with DB (optional)
        if (token?.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: token.email as string },
              select: { role: true },
            });
            if (dbUser) token.role = dbUser.role;
          } catch {
            // ignore DB lookup failures
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // attach id + role to session.user
        (session.user as any).id = token.sub as string;
        (session.user as any).role = (token as any).role ?? "USER";
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
    throw new Error("Unauthorized");
  }
  return session;
}

export async function auth() {
  return getServerAuthSession();
}
