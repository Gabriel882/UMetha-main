// types/next-auth.d.ts

import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// Extend the Session interface to include `id` and `role`
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
  }
}

// Extend the JWT interface to include `id` and `role`
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
