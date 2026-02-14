import { createAppAuth, createOAuthUserAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";

const privateKey = Buffer.from(
  process.env.GITHUB_PRIVATE_KEY!,
  "base64",
).toString("utf-8");

export const appOctokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: parseInt(process.env.GITHUB_APP_ID!),
    privateKey,
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
});

export async function getUserOctokit(oauthCode: string) {
  return (await appOctokit.auth({
    type: "oauth-user",
    code: oauthCode,
    factory: (options: unknown) => {
      return new Octokit({
        authStrategy: createOAuthUserAuth,
        auth: options,
      });
    },
  })) as Octokit;
}
