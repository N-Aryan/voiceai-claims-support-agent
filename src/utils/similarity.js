function cosineSimilarity(leftEmbedding, rightEmbedding) {
  if (!Array.isArray(leftEmbedding) || !Array.isArray(rightEmbedding)) {
    return 0;
  }

  if (leftEmbedding.length === 0 || leftEmbedding.length !== rightEmbedding.length) {
    return 0;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < leftEmbedding.length; index += 1) {
    dotProduct += leftEmbedding[index] * rightEmbedding[index];
    leftMagnitude += leftEmbedding[index] * leftEmbedding[index];
    rightMagnitude += rightEmbedding[index] * rightEmbedding[index];
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

module.exports = { cosineSimilarity };
