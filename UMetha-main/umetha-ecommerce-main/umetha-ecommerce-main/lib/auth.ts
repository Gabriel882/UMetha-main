// lib/auth.ts (NextAuth v5 Compatible)

import type { NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";

export const authOptions: NextAuthConfig = {
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER!,
      from: process.env.EMAIL_FROM!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      // When a user first logs in
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

export default authOptions;
