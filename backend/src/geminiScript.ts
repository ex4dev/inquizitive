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
        Generate 5 multiple-choice questions based on the following diff.

        Each question must:
        - Have 4 answer choices
        - Include exactly one correct answer
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
                      correct: {
                        type: "boolean",
                        description:
                          "True if this answer is the correct answer, false otherwise",
                      },
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
