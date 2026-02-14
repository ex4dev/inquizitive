import { useState } from "react";
import "./App.css";
import QuizQuestion from "./components/QuizQuestion";

function App() {
  const prName = "Pull Request Name";
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

export default App;
