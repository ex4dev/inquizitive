import QuizQuestion from "../components/QuizQuestion";
import { useQuiz } from "../hooks/apiHooks";

// /api/auth/login
// /api/user/me

export default function Quiz({ id }: { id: number }) {
  const { isLoading, error, data: quiz } = useQuiz(id);

  if (isLoading) return <></>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="prose m-auto mt-5">
      <h1>Inquizitive - {quiz?.prName}</h1>
      <p>
        Please take a short quiz to verify the authenticity of this PR. This
        helps our maintainers to streamline the review process.
      </p>
      <form>
        {quiz?.questions?.map((q) => (
          <QuizQuestion
            questionId={q.id.toString()}
            key={q.id}
            questionText={q.text}
            answerChoices={q.answerChoices}
          />
        ))}
        <input
          type="submit"
          value="Submit"
          className="bg-green-400 p-3 rounded-xl"
        />
      </form>
    </div>
  );
}
