const { env } = require('../config/env');
const { getGeminiHeaders, getGeminiModelPath } = require('../config/gemini');
const { AppError } = require('../utils/errors');

async function geminiFetch(methodName, modelName, body, failureMessage) {
  try {
    const response = await fetch(getGeminiModelPath(modelName, methodName), {
      method: 'POST',
      headers: getGeminiHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new AppError(502, failureMessage, {
        cause: new Error(data.error?.message || `Gemini request failed with status ${response.status}`),
      });
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(502, failureMessage, { cause: error });
  }
}

async function generateEmbedding(text) {
  const failureMessage =
    'Knowledge search is unavailable right now. Please offer representative support.';
  const modelName = env.GEMINI_EMBEDDING_MODEL;

  const data = await geminiFetch(
    'embedContent',
    modelName,
    {
      model: `models/${modelName}`,
      content: {
        parts: [{ text }],
      },
    },
    failureMessage,
  );

  const embedding =
    data.embedding?.values ||
    data.embedding?.value ||
    data.embeddings?.[0]?.values ||
    data.embeddings?.[0]?.value;

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new AppError(502, failureMessage, {
      cause: new Error('Gemini embedding response did not include a numeric vector.'),
    });
  }

  return embedding;
}

function extractTextFromGeminiResponse(data) {
  const parts = data.candidates?.[0]?.content?.parts || [];

  return parts
    .map((part) => (typeof part.text === 'string' ? part.text.trim() : ''))
    .filter(Boolean)
    .join('\n')
    .trim();
}

async function generateGroundedAnswer({ query, contexts }) {
  const failureMessage =
    'Knowledge search is unavailable right now. Please offer representative support.';
  const modelName = env.GEMINI_GENERATION_MODEL;
  const contextBlock = contexts
    .map(
      (context, index) =>
        `Source ${index + 1}\nTitle: ${context.title}\nCategory: ${context.category}\nContent: ${context.content}`,
    )
    .join('\n\n');

  const prompt = [
    'You are answering an insurance claims support FAQ.',
    'Answer only using the retrieved context.',
    'Keep the answer short and voice-friendly.',
    'Do not invent policy, claim, legal, medical, or financial information.',
    'If the answer is not present in the retrieved context, say that you do not have enough information and suggest representative support.',
    '',
    `Caller question: ${query}`,
    '',
    'Retrieved context:',
    contextBlock,
  ].join('\n');

  const data = await geminiFetch(
    'generateContent',
    modelName,
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 160,
      },
    },
    failureMessage,
  );

  const answer = extractTextFromGeminiResponse(data);

  if (!answer) {
    throw new AppError(502, failureMessage, {
      cause: new Error('Gemini generation response did not include answer text.'),
    });
  }

  return answer;
}

module.exports = {
  generateEmbedding,
  generateGroundedAnswer,
};
