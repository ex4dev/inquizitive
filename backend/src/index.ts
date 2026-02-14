import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/api/github/webhook", (c) => {
  // Handle GitHub webhook payloads
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
  // A `code` URL parameter exists with the OAuth code
  // TODO verify `state`
  const response = await fetch(
    `https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${c.req.query("code")!}`,
    {
      method: "POST",
    },
  );
  return c.text("");
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
