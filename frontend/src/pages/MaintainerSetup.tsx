import { BASE_URL } from "../App";
import "../App.css";

export default function MaintainerSetup() {
  return (
    <div className="prose">
      <h1>Maintainer setup!!!</h1>
      <a href={BASE_URL + "api/github/install"}>Install it!!!</a>
    </div>
  );
}
