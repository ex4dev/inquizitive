import { BASE_URL } from "../App";
import "../App.css";

export default function MaintainerSetup() {
  return (
    <div className="prose m-auto mt-5">
      <h1>Inquizitive</h1>
      <p>
        Stop AI contribution spam with short quizzes to verify authenticity.
      </p>
      <a
        href={BASE_URL + "api/github/install"}
        className="bg-green-400 p-3 rounded-xl hover:bg-green-300 focus:bg-green-500 transition-all no-underline"
      >
        Install via GitHub
      </a>
    </div>
  );
}
