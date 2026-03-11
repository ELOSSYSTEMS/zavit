# 03_EVENT_MODEL

**Status:** CANONICAL  
**Version:** v0.1

## Purpose
Defines the atomic unit of the system—the "Event"—which serves as the parent object for all comparison and clustering.

## Hard Constraints
*   **Definition:** An "Event" is a discrete, real-world occurrence reported by at least two distinct, independent sources.
*   **Hierarchy:** Articles, videos, and audio clips are children of an Event. They cannot exist as top-level items in the main feed.
*   **Rolling Events:** Long-running situations (e.g., "War in Gaza") are Topics, not Events. Specific incidents within them (e.g., "Hospital Strike on [Date]") are Events.
*   **Uniqueness:** Duplicate reports of the same incident must be merged into a single Event cluster.

## Explicit Non-Goals
*   **No "Single Source" Events:** A story reported by only one outlet is treated as "Unverified Report" or pending, not a confirmed Event (to prevent amplifying errors/hoaxes).
*   **No Opinion-As-Event:** An op-ed published about the war is an article *about* the war, not an event itself.
*   **No "Topic" Clustering:** We do not cluster by vague themes like "Politics" alone; there must be a specific news hook.
