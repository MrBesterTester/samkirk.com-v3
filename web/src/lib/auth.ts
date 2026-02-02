import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isEmailAllowed } from "./admin-allowlist";

// Re-export for convenience
export { isEmailAllowed } from "./admin-allowlist";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    /**
     * Control whether a user is allowed to sign in.
     * Only allow users whose email is in the allowlist.
     */
    signIn({ user }) {
      return isEmailAllowed(user.email);
    },
    /**
     * Add custom properties to the session.
     * Include the user's email for admin checks.
     */
    session({ session, token }) {
      if (token.email) {
        session.user.email = token.email;
      }
      return session;
    },
    /**
     * Include email in the JWT token.
     */
    jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
  },
  // Use AUTH_SECRET from environment for signing tokens
  secret: process.env.AUTH_SECRET,
});
