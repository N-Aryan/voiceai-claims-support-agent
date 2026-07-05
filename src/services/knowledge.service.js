const { createHash } = require('crypto');

const { getSheetRows } = require('./sheets.service');
const { generateEmbedding, generateGroundedAnswer } = require('./gemini.service');
const { cosineSimilarity } = require('../utils/similarity');

const SIMILARITY_THRESHOLD = 0.76;
const AMBIGUOUS_SCORE_GAP = 0.05;
const KNOWLEDGE_CACHE_TTL_MS = 10 * 60 * 1000;

const NO_CONFIDENT_ANSWER =
  'I could not find a confident answer in the claims knowledge base. Please offer representative support.';

const CLAIM_SPECIFIC_QUESTION_ANSWER =
  'This looks like a claim-specific question. Please authenticate the caller and use the claim status flow instead of the knowledge base.';

const RETRIEVAL_MODE = 'gemini_rag';

const knowledgeCache = {
  loadedAt: 0,
  documents: [],
};

function buildKnowledgeText(row) {
  return [row.title, row.category, row.content].filter(Boolean).join('\n');
}

function buildDocumentSignature(text) {
  return createHash('sha1').update(text).digest('hex');
}

function isClaimSpecificQuestion(query) {
  const normalizedQuery = String(query || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const claimSpecificPatterns = [
    /\bmy claim\b/,
    /\bclaim status\b/,
    /\bstatus of my claim\b/,
    /\bmy documents\b/,
    /\bmissing documents\b/,
    /\bdocuments missing\b/,
    /\bmissing documents.*\bmy claim\b/,
    /\bdocuments.*\bmy claim\b/,
    /\bmy claim.*\bdocuments\b/,
    /\bmy payout\b/,
    /\bmy payment\b/,
    /\bmy approval\b/,
    /\bmy settlement\b/,
    /\bmy policy\b/,
    /\bclaim id\b/,
  ];

  return claimSpecificPatterns.some((pattern) => pattern.test(normalizedQuery));
}

async function loadKnowledgeDocuments() {
  const cacheIsFresh =
    knowledgeCache.documents.length > 0 &&
    Date.now() - knowledgeCache.loadedAt < KNOWLEDGE_CACHE_TTL_MS;

  if (cacheIsFresh) {
    return knowledgeCache.documents;
  }

  const rows = await getSheetRows('knowledge_base');
  const previousEmbeddings = new Map(
    knowledgeCache.documents.map((document) => [document.signature, document.embedding]),
  );

  const documents = rows.map((row) => {
    const text = buildKnowledgeText(row);
    const signature = buildDocumentSignature(text);

    return {
      doc_id: row.doc_id,
      title: row.title,
      category: row.category,
      content: row.content,
      text,
      signature,
      embedding: previousEmbeddings.get(signature) || null,
    };
  });

  const documentsNeedingEmbeddings = documents.filter((document) => !document.embedding);

  if (documentsNeedingEmbeddings.length > 0) {
    // Embeddings are cached per process so repeated VoiceAI tool calls stay fast and cheap.
    const newEmbeddings = await Promise.all(
      documentsNeedingEmbeddings.map((document) => generateEmbedding(document.text)),
    );

    documentsNeedingEmbeddings.forEach((document, index) => {
      document.embedding = newEmbeddings[index];
    });
  }

  knowledgeCache.documents = documents;
  knowledgeCache.loadedAt = Date.now();
  console.info(`[knowledge] cache refresh loaded ${documents.length} knowledge base rows`);

  return documents;
}

async function searchKnowledgeBase(query) {
  console.info(`[knowledge] incoming query="${query}"`);

  if (isClaimSpecificQuestion(query)) {
    console.info('[knowledge] blocked claim-specific question from RAG path');

    return {
      found: false,
      answer: CLAIM_SPECIFIC_QUESTION_ANSWER,
      sources: [],
      retrieval_mode: RETRIEVAL_MODE,
    };
  }

  const documents = await loadKnowledgeDocuments();

  if (documents.length === 0) {
    return {
      found: false,
      answer: NO_CONFIDENT_ANSWER,
      sources: [],
      retrieval_mode: RETRIEVAL_MODE,
    };
  }

  console.info(`[knowledge] knowledge base loaded count ${documents.length}`);

  const queryEmbedding = await generateEmbedding(query);
  const rankedDocuments = documents
    .map((document) => ({
      ...document,
      score: cosineSimilarity(queryEmbedding, document.embedding),
    }))
    .sort((left, right) => right.score - left.score);

  const topDocuments = rankedDocuments.slice(0, 2);
  const bestDocument = topDocuments[0];
  const secondBestDocument = topDocuments[1];

  if (bestDocument) {
    console.info(
      `[knowledge] top source "${bestDocument.title}" score=${bestDocument.score.toFixed(2)}`,
    );
  }

  if (!bestDocument || bestDocument.score < SIMILARITY_THRESHOLD) {
    return {
      found: false,
      answer: NO_CONFIDENT_ANSWER,
      sources: [],
      retrieval_mode: RETRIEVAL_MODE,
    };
  }

  const retrievalIsAmbiguous =
    secondBestDocument &&
    bestDocument.score - secondBestDocument.score < AMBIGUOUS_SCORE_GAP &&
    bestDocument.category !== secondBestDocument.category;

  if (retrievalIsAmbiguous) {
    console.info(
      `[knowledge] ambiguous retrieval between "${bestDocument.title}" and "${secondBestDocument.title}"`,
    );

    return {
      found: false,
      answer: NO_CONFIDENT_ANSWER,
      sources: topDocuments.map((document) => ({
        doc_id: document.doc_id,
        title: document.title,
        category: document.category,
        score: Number(document.score.toFixed(2)),
      })),
      retrieval_mode: RETRIEVAL_MODE,
    };
  }

  const answer = await generateGroundedAnswer({
    query,
    contexts: topDocuments,
  });

  const normalizedAnswer = String(answer || '').toLowerCase();
  const answerIsUncertain =
    !answer ||
    normalizedAnswer.includes('not enough information') ||
    normalizedAnswer.includes('cannot answer') ||
    normalizedAnswer.includes('not provided in the context') ||
    normalizedAnswer.includes('do not have enough');

  if (answerIsUncertain) {
    return {
      found: false,
      answer: NO_CONFIDENT_ANSWER,
      sources: topDocuments.map((document) => ({
        doc_id: document.doc_id,
        title: document.title,
        category: document.category,
        score: Number(document.score.toFixed(2)),
      })),
      retrieval_mode: RETRIEVAL_MODE,
    };
  }

  return {
    found: true,
    answer,
    sources: topDocuments.map((document) => ({
      doc_id: document.doc_id,
      title: document.title,
      category: document.category,
      score: Number(document.score.toFixed(2)),
    })),
    retrieval_mode: RETRIEVAL_MODE,
  };
}

module.exports = { searchKnowledgeBase };