# inquizitive

Stop AI contribution spam with short quizzes to verify authenticity.

## Inspiration

I saw [this blog post](https://www.0xsid.com/blog/aidr) a few days ago, and it really resonated with me. The author points out that, with the popularization of AI tools, the amount of effort required to write something is now less than the amount required to read it. This has led to open-source maintainers being flooded with AI-generated pull requests that people have submitted without performing any manual validation of their changes. Several solutions have been created to address this, including Mitchell Hashimoto's [vouch/denounce system](https://github.com/mitchellh/vouch/), which requires maintainers to mark contributors as eligible to submit pull requests. We thought there had to be a better way that allowed maintainers to pre-screen candidates without wasting any more of their valuable time.

## What it does

When a contributor submits a pull request to a repository managed by Inquizitive, it automatically generates a quiz using the pull request's diff and description. It posts a link to it in the pull request comments, and when the submitter completes it, a label is added to the pull request that indicates whether they passed.

## How we built it

Inquizitive is a full-stack web application written in TypeScript. On the frontend, we're using React and TailwindCSS, and on the backend, we're using Hono and Prisma. We're using a GitHub App to subscribe to new pull requests on users' repositories and the GitHub API for user authentication and interacting with pull request comments as a bot. Finally, we're using SQLite for the database and the Gemini API for AI quiz generation.

## Challenges we ran into

We ran into an issue with CORS since our API was hosted on a separate domain as our backend. Our API requests went through to the backend, but cookies weren't being sent, so the user's session ID wasn't being included. We addressed this by proxying the API through a route on our frontend domain.

## Accomplishments that we're proud of

We're proud of our seamless integration with GitHub. Maintainers can set it up by clicking a link and installing our app on their organizations, and users visit it directly from GitHub comments. Keeping everything inside GitHub helps reduce friction and streamline the user experience.

## What we learned

In developing this project, we learned how to use structured outputs with the Gemini API. Structured outputs allow you to constrain the model to only output valid structured data, which allows you to get much more reliable structured outputs from LLMs. We use this feature to generate the quizzes, since each quiz must have a list of questions, each of which has question text, answer choices, and a correct answer.

## What's next for Inquizitive

We're looking into adding more controls for project maintainers, including the passing score, a list of users who can bypass the quizzes, and prompt modifications like the quiz length and focus areas for questions. We also want to introduce free-response questions with typing replays to help prevent AI use on the quizzes. Finally, we'd like to run Inquizitive on some real-world projects to gather some feedback on how to improve the product going forward.
