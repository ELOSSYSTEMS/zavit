import test from "node:test";
import assert from "node:assert/strict";

import { predictEventGroups } from "../../lib/clustering/predict-groups.mjs";

test("predictEventGroups keeps unrelated attack coverage out of the same cluster", async () => {
  const result = await predictEventGroups(
    [
      {
        id: "rg-1",
        sourceSlug: "ynet",
        language: "HEBREW",
        headline: "Stabbing attack in Ramat Gan leaves two injured",
        snippet:
          "Two people were injured on Bialik Street in Ramat Gan and police arrested a suspect at the scene.",
        publishedAt: "2026-03-12T18:00:00Z",
      },
      {
        id: "mi-1",
        sourceSlug: "haaretz",
        language: "ENGLISH",
        headline: "Michigan synagogue shooting leaves suspect at large",
        snippet:
          "A gunman opened fire outside a synagogue in Dearborn, Michigan and the FBI joined the investigation.",
        publishedAt: "2026-03-12T18:20:00Z",
      },
      {
        id: "tz-1",
        sourceSlug: "walla",
        language: "HEBREW",
        headline: "Attacker neutralized near Tapuach Junction after ramming attempt",
        snippet:
          "Soldiers stopped an assailant near Tapuach Junction in the West Bank after an attempted car-ramming attack.",
        publishedAt: "2026-03-12T18:35:00Z",
      },
    ],
    {
      provider: "deterministic",
    },
  );

  assert.equal(result.groups.length, 0);
  assert.deepEqual(result.heldArticleIds, ["mi-1", "rg-1", "tz-1"]);
});

test("predictEventGroups still clusters coherent multi-source coverage of the same event", async () => {
  const result = await predictEventGroups(
    [
      {
        id: "sd-1",
        sourceSlug: "ynet",
        language: "HEBREW",
        headline: "Schools in Sderot open late after rocket alert",
        snippet: "Municipal officials delayed classes in Sderot after sirens near the Gaza border.",
        publishedAt: "2026-03-10T08:05:00Z",
      },
      {
        id: "sd-2",
        sourceSlug: "n12",
        language: "HEBREW",
        headline: "Rocket alert near Sderot delays school opening",
        snippet: "Local officials in Sderot said schools would start later after the warning siren.",
        publishedAt: "2026-03-10T08:12:00Z",
      },
      {
        id: "sd-3",
        sourceSlug: "makan",
        language: "ARABIC",
        headline: "Sirens near Sderot force delayed school opening",
        snippet: "Arabic coverage of the same morning alert and delayed classes in Sderot.",
        publishedAt: "2026-03-10T08:18:00Z",
      },
    ],
    {
      provider: "deterministic",
      independenceGroupBySlug: new Map([
        ["ynet", "g1"],
        ["n12", "g2"],
        ["makan", "g3"],
      ]),
    },
  );

  assert.equal(result.groups.length, 1);
  assert.deepEqual(result.groups[0].articleIds, ["sd-1", "sd-2", "sd-3"]);
  assert.equal(result.groups[0].clusterCoherent, true);
});

test("predictEventGroups blocks merges when high-confidence anchor locations contradict", async () => {
  const result = await predictEventGroups(
    [
      {
        id: "loc-1",
        sourceSlug: "ynet",
        language: "HEBREW",
        headline: "Stabbing attack leaves two injured in Ramat Gan",
        snippet: "Police said two people were injured and the suspect was arrested.",
        publishedAt: "2026-03-12T18:00:00Z",
        eventType: "stabbing",
        locations: ["Ramat Gan"],
        extractedDatetime: "2026-03-12T18:00:00Z",
        anchorConfidence: 0.92,
        anchorExtractionStatus: "OK",
      },
      {
        id: "loc-2",
        sourceSlug: "n12",
        language: "HEBREW",
        headline: "Stabbing attack leaves two injured in Jerusalem",
        snippet: "Police said two people were injured and the suspect was arrested.",
        publishedAt: "2026-03-12T18:05:00Z",
        eventType: "stabbing",
        locations: ["Jerusalem"],
        extractedDatetime: "2026-03-12T18:05:00Z",
        anchorConfidence: 0.94,
        anchorExtractionStatus: "OK",
      },
    ],
    {
      provider: "deterministic",
    },
  );

  assert.equal(result.groups.length, 0);
  assert.deepEqual(result.heldArticleIds, ["loc-1", "loc-2"]);
});

test("predictEventGroups does not block valid merges when anchors are missing", async () => {
  const result = await predictEventGroups(
    [
      {
        id: "pa-1",
        sourceSlug: "ynet",
        language: "HEBREW",
        headline: "Cabinet approves revised budget package overnight",
        snippet: "Coalition ministers backed the updated budget after late negotiations.",
        publishedAt: "2026-03-12T18:00:00Z",
        eventType: "political",
        locations: [],
        extractedDatetime: null,
        anchorConfidence: 0.45,
        anchorExtractionStatus: "HEURISTIC",
      },
      {
        id: "pa-2",
        sourceSlug: "n12",
        language: "HEBREW",
        headline: "Coalition clears updated budget package in overnight vote",
        snippet: "Ministers approved the revised budget after late-night negotiations.",
        publishedAt: "2026-03-12T18:08:00Z",
        eventType: null,
        locations: [],
        extractedDatetime: null,
        anchorConfidence: 0,
        anchorExtractionStatus: "FAILED",
      },
    ],
    {
      provider: "deterministic",
      independenceGroupBySlug: new Map([
        ["ynet", "g1"],
        ["n12", "g2"],
      ]),
    },
  );

  assert.equal(result.groups.length, 1);
  assert.deepEqual(result.groups[0].articleIds, ["pa-1", "pa-2"]);
});
