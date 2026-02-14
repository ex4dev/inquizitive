import { useId } from "react";

export default function QuizQuestion({
  questionId,
  questionText,
  answerChoices,
}: {
  questionId: string;
  questionText: string;
  answerChoices: string[];
}) {
  return (
    <fieldset className="bg-green-50 rounded-2xl border-2 mt-2 mb-2 p-5 flex flex-col">
      <h2 className="mt-0">{questionText}</h2>
      {answerChoices.map((answer) => (
        <AnswerChoice questionId={questionId} answer={answer} />
      ))}
    </fieldset>
  );
}

function AnswerChoice({
  questionId,
  answer,
}: {
  questionId: string;
  answer: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-row gap-1">
      <input type="radio" name={questionId} value={id} id={id} />
      <label htmlFor={id}>{answer}</label>
    </div>
  );
}
