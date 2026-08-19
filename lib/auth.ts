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
/**
 * Sessions are JWTs signed with this secret. A hardcoded fallback would mean a
 * missing env var in production yields forgeable admin tokens rather than a
 * loud failure, so refuse to start without it outside development.
 */
function requireAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXTAUTH_SECRET is not set. Generate one with `openssl rand -base64 32` and set it in the environment."
    );
  }
  console.warn("NEXTAUTH_SECRET is not set — using an insecure development-only secret.");
  return "insecure-development-only-secret";
}

export const authOptions: NextAuthOptions = {
  secret: requireAuthSecret(),
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
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

        const user = await prisma.user.findUnique({ 
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
          permissions: (user as { customRole?: { permissions: string[] } }).customRole?.permissions || [],
        };
      },
    }),
  ],
  callbacks: {
    // Runs on initial sign-in (with `user`) and on every subsequent request (without `user`)
    async jwt({ token, user }) {
      if (user) {
        token.role = ((user as unknown as { role?: string }).role ?? "USER") as "USER" | "ADMIN";
        token.permissions = (user as unknown as { permissions?: string[] }).permissions ?? [];
      } else if (token?.email) {
        // Fetch fresh data from DB on every token check to ensure permissions are up to date
        // This solves the latency issue when an Admin modifies a user's role/permissions
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { role: true, customRole: { select: { permissions: true } } },
          });
          if (dbUser) {
            token.role = ((dbUser as unknown as { role: string }).role) as "USER" | "ADMIN";
            token.permissions = (dbUser as unknown as { customRole?: { permissions: string[] } }).customRole?.permissions ?? [];
          }
        } catch (e) {
          console.error("JWT sync error:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { id: string }).id = token.sub as string;
        (session.user as unknown as { role: string }).role = (token as { role?: string }).role ?? "USER";
        (session.user as unknown as { permissions: string[] }).permissions = (token as { permissions?: string[] }).permissions ?? [];
      }
      return session;
    },
  },
  logger: {
    error(code, metadata) {
      console.error("Auth Error:", { code, metadata });
    },
    warn(code) {
      console.warn("Auth Warning:", code);
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
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    throw Object.assign(new Error("Unauthorized"), { code: 401 });
  }
  return session;
}

/** Throw if the user does not have one of the required roles */
export async function requireAnyRole(roles: string[]) {
  const session = await getServerAuthSession();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !role || !roles.includes(role)) {
    throw Object.assign(new Error("Forbidden"), { code: 403 });
  }
  return session;
}

export async function auth() {
  return getServerAuthSession();
}
