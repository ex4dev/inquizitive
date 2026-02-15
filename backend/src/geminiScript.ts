/**
 * Sends .diff file to Gemini and returns structured JSON
 * @param diffAsString
 * @param apiKey
 * @returns
 */
export async function sendDiffToGemini(diff: string, apiKey: string) {
  const payload = buildPayload(diff);
  return generateGeminiResponse(payload, apiKey);
}

function buildPayload(diff: string) {
  const prompt = `
       Create a quiz about the .diff file. 
       Depending on the number of lines of the .diff file, 
       the number of questions as well as the type of questions will be different:
       - If the .diff file is 1 line, ask 1 question. 
       If the .diff file is 2-20 lines, ask 2 questions.
       If the .diff file is 21-50 lines, ask 3 questions.
       If the .diff file is 51-100 lines, ask 4 questions. One question has to be about security and performance of the new code.
       If the .diff file is 101+ lines, ask 5 questions. One question has to be about security and performance. ANother question has to be about this breaks old functionality.

        Each question must:
        - Have 4 answer choices
        - Include exactly one correct answer, where it has a...
         25% chance of being a, 
         25% chance of being b,
         25% chance of being c,
         and 25% chance of being d. \n


    Diff: ${diff}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],

    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                choices: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      correct: { type: "boolean" },
                      description: {
                        type: "string",
                        descrption: "The text of the answer choice",
                      },
                    },
                  },
                },
              },
              required: ["question", "choices"],
            },
          },
        },
      },
    },
  };
  return payload;
}

async function generateGeminiResponse(payload: any, apiKey: string) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": "" + apiKey,
      },
      body: JSON.stringify(payload),
    },
  );
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
