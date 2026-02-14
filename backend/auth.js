// apps/web-app/src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      // We need 'repo' scope to approve PRs on their behalf later
      authorization: { params: { scope: "read:user repo" } },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Add the GitHub username and Access Token to the session
      session.user.username = token.profile?.login;
      session.accessToken = token.accessToken;
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.profile = profile;
      }
      return token;
    },
  },
});

export { handler as GET, handler as POST };
