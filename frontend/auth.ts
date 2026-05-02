import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

/**
 * Allowed email domains for student verification.
 * Add your university's email domain(s) here.
 * Example: ["university.edu", "student.university.edu"]
 */
const ALLOWED_DOMAINS: string[] = (
  process.env.ALLOWED_EMAIL_DOMAINS ?? ""
)
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

function isAllowedStudentEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  // If no domains are configured, allow any Microsoft-authenticated user
  if (ALLOWED_DOMAINS.length === 0) return true;

  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_DOMAINS.some(
    (allowed) => domain === allowed || domain?.endsWith(`.${allowed}`)
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      // Use "common" to allow any Microsoft org, or a specific tenant ID
      // to restrict to a single university's Azure AD directory.
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID ?? "common"}/v2.0`,
      authorization: {
        params: {
          // Request email and profile scopes
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
  callbacks: {
    async signIn({ user, profile }) {
      // Use the email from the profile (Microsoft) or user object
      const email = (profile?.email as string) ?? user.email;

      if (!isAllowedStudentEmail(email)) {
        // Redirect to error page — the student's domain is not allowed
        return `/auth-error?reason=domain&email=${encodeURIComponent(email ?? "")}`;
      }

      return true;
    },
    async session({ session, token }) {
      // Pass user id into the session for downstream use
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.email = (profile.email as string) ?? profile.preferred_username;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
});
