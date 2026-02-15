import { sendDiffToGemini } from "./geminiScript.js";
import { payload } from "./variableFile.js";

async function main() {
  const result = await sendDiffToGemini(payload, "");

  console.log(JSON.stringify(result));
}

main();
