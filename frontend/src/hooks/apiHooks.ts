import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../App";

interface User {
  id: number;
  name: string;
  githubUserId: number;
  githubUserLogin: string;
}

interface Quiz {
  id: number;
  issueNumber: number;
  owner: string;
  repo: string;
  questions: Question[];
  prName: string;
}

interface Question {
  id: number;
  choices: string[];
  text: string;
  answer?: string;
}

export function useUser() {
  const x = useQuery<User>({
    queryKey: ["user"],
    queryFn: () =>
      fetch(BASE_URL + "api/user/me", { credentials: "include" }).then((res) =>
        res.json(),
      ),
  });

  if (x.data && "error" in x.data && x.data.error === "Unauthorized") {
    window.location.href = BASE_URL + "/api/auth/login";
  }

  return x;
}

export function useQuiz(id: number) {
  return useQuery<Quiz>({
    queryKey: ["quiz", id],
    queryFn: () =>
      fetch(BASE_URL + "api/quiz/" + id, { credentials: "include" }).then(
        (res) => res.json(),
      ),
  });
}
