import { useMemo } from "react";
import { useLocation } from "react-router";
import { BASE_URL } from "../App";
import QuizQuestion from "../components/QuizQuestion";
import { useQuiz } from "../hooks/apiHooks";

// https://v5.reactrouter.com/web/example/query-parameters
function useQuery() {
  const { search } = useLocation();

  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function QuizPage() {
  const query = useQuery();
  const id = query.get("id");
  if (!id) return <p>Please specify a quiz ID!</p>;
  return <Quiz id={+id} />;
}

export function Quiz({ id }: { id: number }) {
  const { isLoading, error, data: quiz } = useQuiz(id);

  if (isLoading) return <></>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="prose prose-invert m-auto mt-5">
      <p className="mb-0">Inquizitive</p>
      <h1 className="playfair-display mb-0">{quiz?.prName}</h1>
      <p className="mb-8">
        Please take a short quiz to verify the authenticity of this PR. This
        helps our maintainers to streamline the review process.
      </p>
      <form>
        {quiz?.questions?.map((q) => (
          <QuizQuestion
            questionId={q.id.toString()}
            key={q.id}
            questionText={q.text}
            answerChoices={q.choices}
          />
        ))}
        <input
          type="submit"
          value="Submit"
          formMethod="post"
          formAction={BASE_URL + "api/submit/" + id}
          className="bg-white rounded-md flex items-center justify-center gap-2 px-3 py-1 text-black hover:bg-gray-200 transition-colors mt-4"
        />
      </form>
    </div>
  );
}
