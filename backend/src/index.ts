import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { randomUUID } from "node:crypto";
import { db } from "./db.ts";
import { appOctokit, getUserOctokit } from "./octokit.ts";
import { Webhooks } from "@octokit/webhooks";

const app = new Hono();

const AUTH_COOKIE_NAME = "inquizitive-user";

app.use(cors());
const webhooks = new Webhooks({ secret: process.env.GITHUB_WEBHOOK_SECRET! });

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/api/github/webhook", async (c) => {
  // Handle GitHub webhook payloads
  const signature = c.req.header("x-hub-signature-256");
  const isValid = await webhooks.verify(await c.req.text(), signature!);
  if (!isValid) {
    return c.text("Invalid", 401);
  }
  const event = c.req.header("x-github-event");
  if (event === "pull_request") {
    const json = await c.req.json();
    if (json.action === "opened") {
      const patchResponse = await fetch(json.pull_request.patch_url);
      const patch = await patchResponse.text();
      // TODO AI
      const userId = json.pull_request.user.id;
      await appOctokit.rest.issues.createComment({
        body: "take this quiz or else: <INSERT THE LINK>",
        owner: json.repository.owner.login,
        repo: json.repository.name,
        issue_number: json.pull_request.number,
      });
    }
  }
  return c.text("");
});

app.get("/api/auth/login", (c) => {
  const state = ""; // TODO
  return c.redirect(
    `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&state=${state}`,
  );
});

app.get("/api/github/install", (c) => {
  return c.redirect(
    `https://github.com/apps/${process.env.GITHUB_APP_NAME}/installations/new`,
  );
});

app.get("/api/auth/callback", async (c) => {
  // GitHub OAuth callback
  // TODO verify `state`
  const octokit = await getUserOctokit(c.req.query("code")!);
  const githubUser = await octokit.rest.users.getAuthenticated();

  const user = await db.user.upsert({
    create: {
      name: githubUser.data.name ?? githubUser.data.login,
      githubUserId: githubUser.data.id,
      githubUserLogin: githubUser.data.login,
    },
    update: {
      name: githubUser.data.name ?? githubUser.data.login,
      githubUserLogin: githubUser.data.login,
    },
    where: {
      githubUserId: githubUser.data.id,
    },
  });

  const session = await db.session.create({
    data: { token: randomUUID(), user: { connect: { id: user.id } } },
  });

  setCookie(c, AUTH_COOKIE_NAME, session.token, { httpOnly: true });

  return c.redirect(process.env.FRONTEND_URL!);
});

app.get("/api/user/me", async (c) => {
  const sessionToken = getCookie(c, AUTH_COOKIE_NAME);

  if (!sessionToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const session = await db.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (session === null) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json(session?.user);
});

app.post("/api/auth/logout", async (c) => {
  const sessionToken = deleteCookie(c, AUTH_COOKIE_NAME);

  if (!sessionToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db.session.delete({ where: { token: sessionToken } });
  return c.json({ success: true });
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
