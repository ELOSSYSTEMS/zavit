# BUILD PLAN #1 (MVP)

**Status:** APPROVED FOR APPROVAL REVIEW
**Target:** MVP → v1 → v1.5
**Governance:** Bound by Canon v0.1

---

### SECTION A — One-paragraph product definition
**Zavit (זווית)** is a Hebrew-first, Israel-focused news clustering engine that mirrors the media landscape by grouping reports of the same real-world event from multiple publishers side-by-side. It explicitly is **not** a publisher, a fact-checker, a social media aggregator, or an editorial body; it is a neutral tool for comparative media consumption.

### SECTION B — MVP Promise and Anti-Promises
**MVP Promises:**
*   **Event-Centricity:** Users always see a cluster of sources for an event, never a standalone article.
*   **Source Diversity:** Every event displays at least two distinct sources (if available).
*   **Neutral Presentation:** All sources receive equal visual weight and strictly descriptive labeling.
*   **Language Native:** The entire interface, including extracted angles, is idiomatic Hebrew (RTL).
*   **Direct Access:** One click driving traffic to the original publisher.

**MVP Anti-Promises:**
*   **No Completeness:** We do not claim to catch every story in Israel; coverage is "best effort."
*   **No Real-Time Breaking:** We do not compete with push notifications; clustering requires a processing lag (15-45 mins).
*   **No Bias Scores:** We do not assign "Left/Right" or numerical bias ratings.
*   **No Social Feeds:** We do not ingest or display Twitter, Telegram, or Facebook content.
*   **No "Truth" Flags:** We do not label stories as "Fake News"; we show the conflict.

### SECTION C — Personas & Key Use Cases (Israel)
**1. The Skeptic (Uri, 34, Tel Aviv)**
*   *Motivation:* Distrusts mainstream narratives; wants to see what "the other side" is saying.
*   *Use Case:* Checks Zavit during a security escalation to compare Channel 14's framing vs. Haaretz's framing of the same incident.
*   *Use Case:* Verifies if a headline he saw on WhatsApp appears on reputable sites.

**2. The Deep Diver (Noa, 28, Student)**
*   *Motivation:* Researching a specific topic; needs multiple distinct data points.
*   *Use Case:* Browses the "Judicial Reform" topic to find specific events and how coverage shifted over the week.

**3. The Passive Consumer (Eitan, 55, Commuter)**
*   *Motivation:* Wants a quick morning briefing without the "noise" of social media.
*   *Use Case:* Scans the top 5 events of the day to ensure he didn't miss a major story from either end of the spectrum.

### SECTION D — Information Architecture (UX map)
**Primary Nav (Right Sidebar/Bottom Bar):** Home | Topics | Saved | Settings

**Screen List:**
1.  **Home (The Feed):** Vertical scroll of "Event Cards" (Cluster summaries), ordered by recency/impact.
2.  **Story Page (Event Detail):** The core interface. Headline comparison, timeline of publication, "Angle" cards breakdown.
3.  **Compare Headlines:** Dedicated view overlapping headlines from Source A vs. Source B.
4.  **Angles View:** Section within Story Page grouping coverage by distinct framing (e.g., "Humanitarian Focus" vs. "Security Focus").
5.  **Coverage List:** Complete list of all detected sources for the event with deep links.
6.  **Outlet Directory:** Static page listing all indexed sources + their " About" (neutral description).
7.  **Settings / Transparency:** About Zavit, Canon declaration, Feedback/Correction forms.

### SECTION E — Data Ingestion Plan (No full RSS assumption)
**Layer 1: Politeness-First RSS (Preferred)**
*   *Inputs:* Valid RSS feeds from major broadcasters (Kan, N12 - if available).
*   *Output:* Title, Link, PubDate, Description (Snippet).
*   *Constraint:* Max 1 request/10min per feed.

**Layer 2: Sitemap & Section Crawl (Fallback A)**
*   *Inputs:* `sitemap.xml` or specific section URLs (e.g., `ynet.co.il/news`).
*   *Output:* New URLs discovered since last check.
*   *Constraint:* Respect `robots.txt`. Identification as "ZavitBot".

**Layer 3: Headline Extraction (Fallback B)**
*   *Inputs:* Specific article pages discovered in Layer 2.
*   *Output:* `<h1>` (Headline), `<meta description>` (Snippet), `og:image` (Thumbnail).
*   *Constraint:* DOM parsing only. **NO** text body extraction. **NO** rendering (use lightweight HTTP requests).
*   *Safety:* If a paywall is detected (via selectors), extract metadata only and flag as "Paywalled".

**Failure Mode:** If ingestion fails for >3 hours, mark specific source as "Temporarily Unavailable" in UI.

### SECTION F — Normalized Data Model (High-Level)
*   **Source (Outlet):** ID, Name, LogoURL, HomepageURL, ReliabilityStatus (Active/Maintenance), PaywallType.
*   **Article:** ID, SourceID, URL (Unique Index), Title, Snippet (max 280 chars), PubDate, Author (if avail), ScrapedAt.
*   **StoryCluster (Event):** ID, Title (System Generated/AI Synthesized), FirstSeenDate, LastUpdateDate, Status (Open/Archived).
*   **ClusterMembership:** ArticleID, ClusterID, ConfidenceScore.
*   **AngleCard:** ClusterID, Label (e.g., "Economic Impact"), SummaryText, ReferenceArticleIDs (List).
*   **CoverageStats (Cache):** ClusterID, SourceCount, EarliestSourceID, LatestSourceID.

### SECTION G — Story Clustering & "One Story" Logic
**Processing Pipeline:**
1.  **Candidate Retrieval:** Select coverage form last 24h.
2.  **Vector Embedding:** Generate embeddings for Headlines + Snippets (Hebrew model).
3.  **Clustering:** DBSCAN or similar density-based clustering on embeddings.
4.  **NER Validation (Hard Gate):** Clusters must share significant Named Entities (people, places) to be confirmed.
5.  **Refinement:**
    *   *Merge:* If [Headline A] and [Headline B] have >0.85 cosine similarity + same Entity.
    *   *Split:* If time gap > 12h (unless explicitly linked as "Update").

**Rolling Events Handling:**
*   Broad tags ("War", "Election") are **Topics**, not Events.
*   Clustering targets *incidents* ("Knesset Vote on Monday", "Strike on Monday night").

**Confidence:**
*   Cluster Confidence < 0.90 -> Do not auto-publish. Flag for human review (MVP) or discard.

### SECTION H — Angle / Framing Extraction (Safe Spec)
**Definition:**
*   An "Angle" is a distinct sub-theme found in a subset of the coverage.

**Safety Rules:**
*   **Descriptive Only:** Labels must be nouns/adjectives describing the *content* (e.g., "Fiscal Analysis"), NOT the intent (e.g., "Attack Piece").
*   **Evidence link:** Every Angle Card must contain: "As seen in: [Source A], [Source B]".
*   **LLM Instruction:** "Identify the primary topic focus of this headline and snippet. Choose from approved list or generate neutral structural label."

**Disclosure:**
*   "Generated by AI" icon on all angle summaries.

### SECTION I — Coverage Imbalance / Blindspots (Optional)
**MVP Scope:**
*   Display "Source Count" (e.g., "Covered by 5 outlets").
*   **NO** "Missing from" lists in MVP Phase 1 (requires high-confidence absence check).

**Future (Phase 2+):**
*   Condition: If User follows Source A, and Source A is *proven* missing from a major cluster (Top 20%), show "Not yet seen on [Source A]".

### SECTION J — Legal & Compliance Guardrails
*   **Copyright:** Store and display only HEADLINE and SNIPPET. No body text storage.
*   **Link-Out:** Clicking a card opens the source in a new browser tab/window (native behavior).
*   **Paywalls:** If detected, append "🔒" icon to the source name. Do not bypass.
*   **Defamation:** No "System Voice" editorials. The only text we generate is the Cluster Title (neutral) and Angle Label (neutral).
*   **Opt-Out:** Admin panel ability to "Blacklist" a domain URL immediately upon legal request.

### SECTION K — Architecture Blueprint (MVP)
**Modules:**
1.  **IngestionEngine:** Node.js/Python workers. Scheduled jobs (BullMQ).
    *   *Inputs:* Config file of Source definitions (RSS/Selectors).
2.  **ParserService:** Sanitize HTML, extract metadata, normalize dates to UTC.
3.  **CoreDB:** PostgreSQL (Relational data).
4.  **VectorDB:** pgvector (Embeddings).
5.  **ClusterBrain:** Service running embeddings + clustering logic + LLM calls (Angle extraction).
6.  **APIGateway:** Next.js API Routes (Serverless).
7.  **WebClient:** Next.js (React), Tailwind (if permitted, otherwise CSS), Shadcn (or similar) for UI.

**Observability:** Sentry for errors. Logging for "Ingestion Health" (Sources passing/failing).

### SECTION L — Phased Delivery Plan (Approval Gates)
**PHASE 0: Foundation (Weeks 1-2)**
*   *Goal:* Validated Source List & Ingestion Proof-of-Concept.
*   *In-Scope:* 10 major Israeli sources. Ingestion pipeline script. DB Schema.
*   *Acceptance:* System ingests headlines from 10 sources into DB without errors.

**PHASE 1: MVP Build (Weeks 3-6)**
*   *Goal:* "It Works." Clusters form automatically.
*   *In-Scope:* Clustering engine, Basic UI (Feed + Story Page), Manual Angle tagging (or basic LLM).
*   *Out-Scope:* User accounts, notification, blindspots.
*   *Acceptance:* 80% accurate clustering on "Top News". < 1% false positives (wrong merging).
*   *Approval Gate:* Reviewer demos the live feed.

**PHASE 2: Reliability & Angles (Weeks 7-10)**
*   *Goal:* High-quality auto-angles.
*   *In-Scope:* Advanced LLM prompts for angles. Reliability handling (retries, proxies). Mobile optimization.
*   *Acceptance:* Angle extraction passing "Neutrality Audit".

**PHASE 3: Expansion (Post v1.0)**
*   *Goal:* Blindspot detection.
*   *In-Scope:* "Not Detected" logic. Social sharing.

### SECTION M — Open Questions / Decisions Needed
**1. Source Count Target (MVP)**
*   A: Top 5 (Kan, N12, Ynet, Haaretz, Walling) - Easiest.
*   B: Top 15 (Includes sectorial: Makor Rishon, Kikar HaShabbat) - Better value prop.
*   **Recommendation:** B (The value is in the diversity).

**2. Refresh Frequency**
*   A: Hourly.
*   B: Every 15 mins.
*   **Recommendation:** B (News moves fast, but 15m is polite enough).

**3. Angle Strictness**
*   A: Pre-defined list (Security, Politics, Economy).
*   B: Generative (LLM writes label).
*   **Recommendation:** A (Safer for neutral governance in MVP).

---

APPROVAL REQUEST: Reply with Phase 0–3 approvals and chosen options from Section M.
