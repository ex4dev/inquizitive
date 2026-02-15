import { serve } from "@hono/node-server";
import { Webhooks } from "@octokit/webhooks";
import type { JsonArray } from "@prisma/client/runtime/client";
import { Hono, type Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { randomUUID } from "node:crypto";
import { db } from "./db.ts";
import { sendDiffToGemini } from "./geminiScript.ts";
import { getInstallationOctokit, getUserOctokit } from "./octokit.ts";

const app = new Hono();

const AUTH_COOKIE_NAME = "inquizitive-user";

type QuizResponse = {
  questions: {
    question: string;
    choices: { correct: boolean; description: string }[];
  }[];
};

app.use(async (c, next) => {
  c.header("Access-Control-Allow-Credentials", "true");
  c.header("Access-Control-Allow-Headers", "Cookie");
  c.header("Access-Control-Allow-Methods", "GET, POST");
  c.header("Access-Control-Allow-Origin", c.req.header("Origin"));
  await next();
});
const webhooks = new Webhooks({ secret: process.env.GITHUB_WEBHOOK_SECRET! });

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

function shuffle(array: any[]): any[] {
  let currentIndex = array.length;

  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

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

      const userId = json.pull_request.user.id;
      const prName = json.pull_request.title;

      console.log("Sending diff to Gemini");
      const quizRes = JSON.parse(
        await sendDiffToGemini(patch, process.env.GEMINI_API_KEY!),
      ) as QuizResponse;

      console.log("Saving quiz data in DB");
      const quiz = await db.quiz.create({
        data: {
          githubUserId: userId,
          prName: prName,
          issueNumber: json.pull_request.number,
          owner: json.repository.owner.login,
          repo: json.repository.name,
          installationId: json.installation.id,
          questions: {
            createMany: {
              data: quizRes.questions.map((q) => ({
                questionText: q.question,
                answerChoices: shuffle(q.choices),
              })),
            },
          },
        },
      });

      console.log("Sending initial comment");
      await getInstallationOctokit(
        json.installation.id,
      ).rest.issues.createComment({
        body:
          "Please take a short quiz to verify the authenticity of this PR. This helps our maintainers to streamline the review process. Take the quiz here: " +
          process.env.FRONTEND_URL +
          "quiz?id=" +
          quiz.id,
        owner: quiz.owner,
        repo: quiz.repo,
        issue_number: quiz.issueNumber,
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

  const perms = await getInstallationOctokit(
    quiz.installationId,
  ).rest.repos.getCollaboratorPermissionLevel({
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
    prName: quiz.prName,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      choices: (q.answerChoices as any[]).map((choice) => choice.description),
      text: q.questionText,
      // Only show answers if the person viewing the quiz has write access to the repository that the quiz was created for
      ...(canWrite
        ? { answer: getCorrectAnswer(q.answerChoices as JsonArray) }
        : {}),
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

  quiz.questions.forEach((question) => {
    const userAnswer = data.get(question.id.toString()); // will be formatted like <question id>_<answer idx>
    if (!userAnswer) {
      return c.text("You must answer all questions");
    }
    const userAnswerIdx = +userAnswer.toString().split("_")[1];
    if (userAnswerIdx == getCorrectAnswer(question.answerChoices as JsonArray))
      numCorrect++;
  });

  const oct = getInstallationOctokit(quiz.installationId);
  // 80% to pass
  if (numCorrect / quiz.questions.length >= 0.8) {
    await oct.rest.issues.createComment({
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
    await oct.rest.issues.addLabels({
      owner: quiz.owner,
      repo: quiz.repo,
      issue_number: quiz.issueNumber,
      labels: ["Passed Quiz"],
    });
  } else {
    // Failed :(
    await oct.rest.issues.createComment({
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
