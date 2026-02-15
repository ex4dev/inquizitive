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
    <fieldset className="bg-gray-800 rounded-2xl border-2 mt-2 mb-2 p-5 flex flex-col">
      <h2 className="mt-0">{questionText}</h2>
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
    <div className="flex flex-row gap-1">
      <input type="radio" name={questionId} value={id} id={id} />
      <label htmlFor={id}>{answer}</label>
    </div>
  );
}
