# 05_COVERAGE_AND_ABSENCE_CLAIMS

**Status:** CANONICAL  
**Version:** v0.1

## Purpose
Defines the vocabulary and burden of proof required to claim that a source has covered—or failed to cover—an event.

## Hard Constraints
*   **"Covered":** The source has published a standalone item or a significant segment about the specific Event.
*   **"Limited Coverage":** The event is mentioned only as a footnote, sidebar, or minor paragraph within a larger, unrelated story.
*   **"Not Detected":** The system cannot find the event on the source’s platforms. (Must use "Not Detected" instead of "Ignored" or "Censored").
*   **Time Lag:** Absence claims must respect a reasonable publication window (e.g., "Source X has not reported this for 4 hours").
*   **High Confidence Only:** Absence cannot be asserted if there is ambiguity in search/indexing.

## Explicit Non-Goals
*   **No Motivation Guessing:** We state "Not Detected," never "Hiding."
*   **No Instant Shaming:** We do not flag absence in real-time (checking < 30 mins) as meaningful, given different newsroom flows.
