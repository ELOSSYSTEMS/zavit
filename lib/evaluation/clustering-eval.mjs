import fs from "node:fs";
import path from "node:path";

export const DEFAULT_THRESHOLDS = {
  falseMergeRateMax: 0.01,
  holdRateMax: 0.2,
  publishEligiblePrecisionMin: 1,
  publishEligibleRecallMin: 0.85,
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeArticleIds(articleIds) {
  return [...new Set(articleIds)].sort();
}

function makePairKey(left, right) {
  return [left, right].sort().join("::");
}

function buildPairSet(groups) {
  const pairs = new Set();

  for (const group of groups) {
    const articleIds = normalizeArticleIds(group.articleIds);

    for (let index = 0; index < articleIds.length; index += 1) {
      for (let inner = index + 1; inner < articleIds.length; inner += 1) {
        pairs.add(makePairKey(articleIds[index], articleIds[inner]));
      }
    }
  }

  return pairs;
}

function countDistinctSources(articleIds, articleById) {
  return new Set(articleIds.map((articleId) => articleById.get(articleId).sourceSlug)).size;
}

function validateUniqueAssignments(groups, heldArticleIds, knownArticleIds, scope) {
  const assignments = new Map();

  for (const group of groups) {
    for (const articleId of group.articleIds) {
      if (!knownArticleIds.has(articleId)) {
        throw new Error(`${scope} references unknown article id ${articleId}`);
      }

      if (assignments.has(articleId)) {
        throw new Error(`${scope} assigns article ${articleId} more than once`);
      }

      assignments.set(articleId, group.id);
    }
  }

  for (const articleId of heldArticleIds) {
    if (!knownArticleIds.has(articleId)) {
      throw new Error(`${scope} references unknown held article id ${articleId}`);
    }

    if (assignments.has(articleId)) {
      throw new Error(`${scope} assigns article ${articleId} to both a group and hold`);
    }

    assignments.set(articleId, "HOLD");
  }
}

export function loadEvaluationDataset(datasetPath) {
  const dataset = readJson(datasetPath);
  const articleById = new Map(dataset.articles.map((article) => [article.id, article]));
  const knownArticleIds = new Set(articleById.keys());

  validateUniqueAssignments(dataset.groups, dataset.holdArticleIds ?? [], knownArticleIds, "Dataset");

  return {
    ...dataset,
    articleById,
    knownArticleIds,
  };
}

export function loadPredictions(predictionsPath) {
  return readJson(predictionsPath);
}

export function evaluatePredictions(datasetInput, predictions, thresholds = DEFAULT_THRESHOLDS) {
  const dataset = datasetInput.articleById ? datasetInput : loadEvaluationDataset(datasetInput);

  if (predictions.datasetVersion !== dataset.datasetVersion) {
    throw new Error(
      `Prediction dataset version ${predictions.datasetVersion} does not match dataset ${dataset.datasetVersion}`,
    );
  }

  validateUniqueAssignments(
    predictions.predictedGroups ?? [],
    predictions.heldArticleIds ?? [],
    dataset.knownArticleIds,
    "Predictions",
  );

  const expectedGroupByArticle = new Map();

  for (const group of dataset.groups) {
    for (const articleId of group.articleIds) {
      expectedGroupByArticle.set(articleId, group.id);
    }
  }

  const expectedPairs = buildPairSet(dataset.groups);
  const predictedPairs = buildPairSet(predictions.predictedGroups ?? []);
  const falseMergePairs = [...predictedPairs].filter((pairKey) => !expectedPairs.has(pairKey));
  const heldPairs = [...expectedPairs].filter((pairKey) => !predictedPairs.has(pairKey));
  const labeledPublishEligibleGroups = dataset.groups.filter((group) => group.publishEligible);
  const predictedPublishEligibleGroups = (predictions.predictedGroups ?? []).filter(
    (group) => group.publishEligible,
  );

  let truePublishEligibleCount = 0;
  const recoveredLabeledGroups = new Set();

  for (const group of predictedPublishEligibleGroups) {
    const normalizedArticleIds = normalizeArticleIds(group.articleIds);
    const firstExpectedGroupId = expectedGroupByArticle.get(normalizedArticleIds[0]) ?? null;
    const allSameExpectedGroup =
      firstExpectedGroupId !== null &&
      normalizedArticleIds.every((articleId) => expectedGroupByArticle.get(articleId) === firstExpectedGroupId);
    const labeledGroup = dataset.groups.find((candidate) => candidate.id === firstExpectedGroupId) ?? null;
    const distinctSources = countDistinctSources(normalizedArticleIds, dataset.articleById);

    if (allSameExpectedGroup && labeledGroup?.publishEligible && distinctSources >= 2) {
      truePublishEligibleCount += 1;
      recoveredLabeledGroups.add(labeledGroup.id);
    }
  }

  const metrics = {
    falseMergeRate:
      predictedPairs.size === 0 ? 0 : Number((falseMergePairs.length / predictedPairs.size).toFixed(4)),
    holdRate:
      expectedPairs.size === 0 ? 0 : Number((heldPairs.length / expectedPairs.size).toFixed(4)),
    publishEligiblePrecision:
      predictedPublishEligibleGroups.length === 0
        ? 0
        : Number((truePublishEligibleCount / predictedPublishEligibleGroups.length).toFixed(4)),
    publishEligibleRecall:
      labeledPublishEligibleGroups.length === 0
        ? 0
        : Number((recoveredLabeledGroups.size / labeledPublishEligibleGroups.length).toFixed(4)),
  };

  const pass =
    metrics.falseMergeRate <= thresholds.falseMergeRateMax &&
    metrics.holdRate <= thresholds.holdRateMax &&
    metrics.publishEligiblePrecision >= thresholds.publishEligiblePrecisionMin &&
    metrics.publishEligibleRecall >= thresholds.publishEligibleRecallMin;

  return {
    datasetVersion: dataset.datasetVersion,
    predictionsLabel: predictions.runLabel,
    datasetPath: path.resolve(dataset.sourcePath ?? ""),
    predictionsPath: path.resolve(predictions.sourcePath ?? ""),
    summary: {
      articleCount: dataset.articles.length,
      labeledGroupCount: dataset.groups.length,
      labeledHoldCount: (dataset.holdArticleIds ?? []).length,
      predictedGroupCount: (predictions.predictedGroups ?? []).length,
      predictedHoldCount: (predictions.heldArticleIds ?? []).length,
      labeledPublishEligibleGroupCount: labeledPublishEligibleGroups.length,
      predictedPublishEligibleGroupCount: predictedPublishEligibleGroups.length,
    },
    metrics,
    thresholds,
    examples: {
      falseMergePairs: falseMergePairs.slice(0, 5),
      heldPairs: heldPairs.slice(0, 5),
      recoveredLabeledGroups: [...recoveredLabeledGroups],
    },
    pass,
  };
}
