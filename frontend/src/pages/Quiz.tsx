import { BASE_URL } from "../App";
import QuizQuestion from "../components/QuizQuestion";
import { useQuery } from "@tanstack/react-query";

// /api/auth/login
// /api/user/me

export default function Quiz() {
  const prName = "Pull Request Name";

  const { isLoading, error, data } = useQuery({
    queryKey: ["repoData"],
    queryFn: () => fetch(BASE_URL + "api/user/me").then((res) => res.json()),
  });

  if (isLoading) return <></>;
  if (error) return <p>Error: {error.message}</p>;

  if (data.error === "Unauthorized") {
    window.location.href = BASE_URL + "/api/auth/login";
  }

  return (
    <div className="prose m-auto mt-5">
      <h1>Inquizitive - {prName}</h1>
      <p>
        Please take a short quiz to verify the authenticity of this PR. This
        helps our maintainers to streamline the review process.
      </p>
      <form>
        <QuizQuestion
          questionId="q1"
          questionText="Question text 1"
          answerChoices={["Answer 1", "Answer 2", "Answer 3"]}
        />
        <QuizQuestion
          questionId="q2"
          questionText="Question text 2"
          answerChoices={["Answer 4", "Answer 5", "Answer 6"]}
        />
        <input
          type="submit"
          value="Submit"
          className="bg-green-400 p-3 rounded-xl"
        />
      </form>
    </div>
  );
}
