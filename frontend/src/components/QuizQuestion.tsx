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
    <fieldset className="bg-zinc-800 rounded-2xl border-2 border-zinc-600 mt-2 mb-8 p-5 flex flex-col gap-2">
      <h2 className="mt-0 playfair-display text-xl">{questionText}</h2>
      {answerChoices.map((answer, idx) => (
        <AnswerChoice questionId={questionId} answer={answer} answerIdx={idx} />
      ))}
    </fieldset>
  );
}

function AnswerChoice({
  questionId,
  answer,
  answerIdx,
}: {
  questionId: string;
  answer: string;
  answerIdx: number;
}) {
  const id = questionId + "_" + answerIdx;
  return (
    <div className="flex flex-row gap-1 items-start">
      <input
        type="radio"
        name={questionId}
        value={id}
        id={id}
        className="mt-[0.4rem]"
      />
      <label htmlFor={id}>{answer}</label>
    </div>
  );
}
