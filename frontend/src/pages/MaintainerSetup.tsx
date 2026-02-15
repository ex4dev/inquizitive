import { BASE_URL } from "../App";
import "../App.css";
import { GitHubIcon } from "../components/GitHubIcon";

export default function MaintainerSetup() {
  return (
    <div className="prose prose-invert flex flex-col size-full mx-auto items-center justify-center min-h-screen">
      <h1 className="playfair-display mb-0">Inquizitive Maintainer Setup</h1>
      <p>
        Stop AI contribution spam with short quizzes to verify authenticity.
      </p>
      <a
        href={BASE_URL + "api/github/install"}
        className="bg-white rounded-md flex items-center justify-center gap-2 px-3 py-1 text-black hover:bg-gray-200 transition-colors mt-4 no-underline"
      >
        <GitHubIcon className="size-6" />
        Install GitHub App
      </a>
    </div>
  );
}
