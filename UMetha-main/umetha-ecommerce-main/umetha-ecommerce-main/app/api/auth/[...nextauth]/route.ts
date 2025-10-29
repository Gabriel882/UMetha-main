// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Import authOptions from the lib/auth.ts

const handler = NextAuth(authOptions);

// Export GET and POST handlers for the NextAuth route
export { handler as GET, handler as POST };
