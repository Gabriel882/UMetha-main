// lib/auth.ts

import { Adapter } from "next-auth/adapters";
import { User, Session } from "next-auth";
import { NextAuthOptions } from "next-auth";
import Providers from "next-auth/providers";

// Mock database call (replace this with your actual DB call)
const yourDatabaseCallToGetUserById = async (id: string) => {
  // Simulate a user record
  return {
    id,
    email: "user@example.com",
    name: "John Doe",
    role: "admin", // Ensure this field exists
  };
};

// Custom Adapter implementation
const myCustomAdapter: Adapter = {
  async getUser(id: string): Promise<User | null> {
    const user = await yourDatabaseCallToGetUserById(id);

    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || "user", // Ensure 'role' is provided
      };
    }
    return null;
  },

  // Additional adapter methods like `createUser`, `updateUser`, etc., can be added here if necessary
  async createUser(user: User) {
    // Create user logic (e.g., insert into DB)
    return user;
  },

  async updateUser(user: User) {
    // Update user logic
    return user;
  },

  async getUserByEmail(email: string) {
    // Get user by email logic (replace with real DB query)
    return null; // Mock, adjust to real behavior
  },

  async getUserByAccount(provider: string, providerAccountId: string) {
    // Handle provider-based accounts (like OAuth)
    return null; // Mock, adjust to real behavior
  },

  // You can define more adapter methods as per your application's requirements
};

// NextAuth configuration
export const authOptions: NextAuthOptions = {
  providers: [
    Providers.Email({
      server: process.env.EMAIL_SERVER, // Configure your email provider
      from: process.env.EMAIL_FROM,
    }),
    // Add other OAuth providers as necessary (e.g., Google, GitHub)
  ],

  adapter: myCustomAdapter, // Use the custom adapter here

  session: {
    strategy: "jwt", // Use JWT session strategy
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin", // Customize the sign-in page as needed
    error: "/auth/error", // Optional error page
  },
};

export default myCustomAdapter;
