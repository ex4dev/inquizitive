import { useUser } from "../hooks/apiHooks";

export const CurrentUser = () => {
  const user = useUser();

  if (user.data) {
    return " - Logged in as " + user.data.name;
  } else {
    return null;
  }
};
