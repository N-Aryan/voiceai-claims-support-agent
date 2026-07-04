const { createHash } = require('crypto');

const { getSheetRows } = require('./sheets.service');
const { generateEmbedding, generateGroundedAnswer } = require('./gemini.service');
const { cosineSimilarity } = require('../utils/similarity');

const SIMILARITY_THRESHOLD = 0.7;
const KNOWLEDGE_CACHE_TTL_MS = 10 * 60 * 1000;
const NO_CONFIDENT_ANSWER =
  'I could not find a confident answer in the claims knowledge base. Please offer representative support.';
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

    return {
      doc_id: row.doc_id,
      title: row.title,
      category: row.category,
      content: row.content,
      text,
      signature: buildDocumentSignature(text),
      embedding: previousEmbeddings.get(buildDocumentSignature(text)) || null,
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

  if (topDocuments[0]) {
    console.info(
      `[knowledge] top source "${topDocuments[0].title}" score=${topDocuments[0].score.toFixed(2)}`,
    );
  }

  if (!topDocuments[0] || topDocuments[0].score < SIMILARITY_THRESHOLD) {
    return {
      found: false,
      answer: NO_CONFIDENT_ANSWER,
      sources: [],
      retrieval_mode: RETRIEVAL_MODE,
    };
  }

  const answer = await generateGroundedAnswer({
    query,
    contexts: topDocuments,
  });

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
