import { serve } from "@hono/node-server";
import { Webhooks } from "@octokit/webhooks";
import { Hono, type Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { randomUUID } from "node:crypto";
import { db } from "./db.ts";
import { appOctokit, getUserOctokit } from "./octokit.ts";
import type { JsonArray, JsonValue } from "@prisma/client/runtime/client";

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
      const prName = json.pull_request.title;
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

app.get("/api/quiz/:quizId", async (c) => {
  const quizId = c.req.param("quizId");
  const id = parseInt(quizId);

  const session = await getSession(c);
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const quiz = await db.quiz.findUnique({
    where: { id: id },
    include: { questions: true },
  });
  if (!quiz) {
    return c.json({ error: "Not found" }, 404);
  }

  const perms = await appOctokit.rest.repos.getCollaboratorPermissionLevel({
    owner: quiz.owner,
    repo: quiz.repo,
    username: session.user.githubUserLogin,
  });

  const canWrite =
    perms.data.permission === "write" || perms.data.permission === "admin"; // data.permission can be "admin", "write", "read", or "none"

  return c.json({
    id: quiz.id,
    issueNumber: quiz.issueNumber,
    owner: quiz.owner,
    repo: quiz.repo,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      choices: q.answerChoices,
      text: q.questionText,
      // Only show answers if the person viewing the quiz has write access to the repository that the quiz was created for
      ...(canWrite ? { answer: q.answer } : {}),
    })),
  });
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

async function getSession(c: Context) {
  const sessionToken = getCookie(c, AUTH_COOKIE_NAME);

  if (!sessionToken) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  return session;
}

app.get("/api/user/me", async (c) => {
  const session = await getSession(c);
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

function getCorrectAnswer(answerChoices: JsonArray): number {
  for (let i = 0; i < answerChoices.length; i++) {
    if ((answerChoices[i] as any)?.correct) return i;
  }
  return -1;
}

app.post("/api/submit/:quizId", async (c) => {
  const quizId = c.req.param("quizId");
  const id = parseInt(quizId);

  const session = await getSession(c);
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const quiz = await db.quiz.findUnique({
    where: { id: id },
    include: { questions: true },
  });
  if (!quiz) {
    return c.json({ error: "Not found" }, 404);
  }

  const data = await c.req.formData();

  let numCorrect = 0;

  quiz.questions.forEach((question, index) => {
    const userAnswer = data.get("q" + index); // will be formatted like <question id>_<answer idx>
    if (!userAnswer) {
      return c.text("You must answer all questions");
    }
    const userAnswerIdx = +userAnswer.toString().split("_")[1];
    if (userAnswerIdx == getCorrectAnswer(question.answerChoices as JsonArray))
      numCorrect++;
  });

  // 80% to pass
  if (numCorrect / quiz.questions.length >= 0.8) {
    await appOctokit.rest.issues.createComment({
      body:
        "Contributor passed the verification quiz (" +
        numCorrect +
        "/" +
        quiz.questions.length +
        ").",
      owner: quiz.owner,
      repo: quiz.repo,
      issue_number: quiz.issueNumber,
    });
    await appOctokit.rest.issues.addLabels({
      owner: quiz.owner,
      repo: quiz.repo,
      issue_number: quiz.issueNumber,
      labels: ["Passed Quiz"],
    });
  } else {
    // Failed :(
    await appOctokit.rest.issues.createComment({
      body:
        "Contributor failed the verification quiz (" +
        numCorrect +
        "/" +
        quiz.questions.length +
        ").",
      owner: quiz.owner,
      repo: quiz.repo,
      issue_number: quiz.issueNumber,
    });
  }
  return c.newResponse(null, 200);
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
