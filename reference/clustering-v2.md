# Phase 1.5: Two-Stage Clustering Pipeline

## Overview
This implementation provides a precision-focused event clustering system with explicit candidate generation and confirmation stages.

## Architecture

### Stage A: Candidate Generation (High Recall)
**Goal:** Generate potential matches with minimal false negatives.

**Triggers:**
- Published within 48h time window
- Share ≥1 HARD entity (numbers, roads, dates)
- OR high keyword similarity (≥0.65)

**Output:** Candidate pairs with reason codes

### Stage B: Cluster Confirmation (High Precision)
**Goal:** Confirm only high-quality matches.

**Required Gates:**
1. ✓ HARD entity match (mandatory)
2. ✓ Combined similarity score ≥ 0.5

**Negative Signals (Auto-Reject):**
- Conflicting numbers
- No HARD entity overlap
- Low combined score

## Entity Classification

### HARD Entities (Gating)
Used for cluster confirmation. Mismatch = reject.
- Numbers (casualties, counts, IDs)
- Roads (`כביש X`)
- Dates
- Exact locations with identifiers

### SOFT Entities (Boosting)
Used to increase similarity. Cannot confirm alone.
- Person names
- Organizations
- Cities/regions

## Confidence Scoring

**Factors** (0-1 scale):
- Outlet diversity (30%)
- HARD entity consistency (40%)
- Temporal density (20%)
- Negative signal penalty (10%)

**Thresholds:**
- Minimum confidence: 0.4 (clusters below this are rejected)
- Target confidence: ≥0.7 (high quality)

## Usage

### Run Clustering
```bash
npx tsx src/scripts/cluster-v2.ts
```

### View Logs
Logs are exported to `clustering-logs.json` with:
- Decision (accepted/rejected)
- Positive signals
- Negative signals
- Confidence scores

### Evaluation
To evaluate against labeled data:
1. Create test pairs in `test-data/labeled-pairs.json`
2. Run clustering
3. Use evaluation harness to calculate precision/recall

## Configuration

Edit thresholds in `src/lib/clustering/v2/pipeline.ts`:
- `TIME_WINDOW_HOURS`: 48 (candidate generation)
- `CONFIRMATION_THRESHOLD`: 0.5 (cluster confirmation)
- Similarity weights (keywords, entities, time)

## Compliance

✅ Canon 03_EVENT_MODEL.md: Requires ≥2 sources per event  
✅ No editorial bias in entity extraction  
✅ All decisions are logged and explainable  
✅ False positives minimized via strict gating

---

**PHASE 1.5 CLUSTERING IMPLEMENTED — READY FOR GOVERNANCE REVIEW.**
