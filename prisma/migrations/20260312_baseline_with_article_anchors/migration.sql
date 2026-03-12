-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SourceLanguage" AS ENUM ('HEBREW', 'ENGLISH', 'ARABIC');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('PRIVATE', 'PUBLIC', 'NGO', 'RELIGIOUS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EditorialType" AS ENUM ('GENERAL_NEWS', 'BROADCAST', 'BUSINESS', 'RELIGIOUS', 'COMMUNITY', 'PUBLIC_SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "LocalityScope" AS ENUM ('NATIONAL', 'REGIONAL', 'LOCAL', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "IngestMethod" AS ENUM ('RSS', 'SITEMAP', 'SECTION_CRAWL', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaywallStatus" AS ENUM ('FREE', 'PARTIAL', 'FULL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('ACTIVE', 'DEGRADED', 'TEMPORARILY_UNAVAILABLE', 'DISABLED');

-- CreateEnum
CREATE TYPE "PipelineRunType" AS ENUM ('INGEST', 'EMBED', 'VERIFY', 'PUBLISH', 'FULL');

-- CreateEnum
CREATE TYPE "PipelineRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'PARTIAL', 'BLOCKED');

-- CreateEnum
CREATE TYPE "FailureType" AS ENUM ('FETCH', 'PARSE', 'NORMALIZE', 'DEDUPE', 'EMBED', 'VERIFY', 'PUBLISH', 'LEGAL_HOLD', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'HELD', 'PUBLISHED', 'SUPPRESSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConfidenceState" AS ENUM ('HIGH', 'LOW', 'REVIEW', 'REJECTED');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('PRIMARY', 'SUPPORTING', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "SupportType" AS ENUM ('CONFIRMS', 'CONFLICTS', 'CONTEXT');

-- CreateEnum
CREATE TYPE "EventReviewStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'CORRECTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('BAD_CLUSTER', 'WRONG_SOURCE', 'BROKEN_LINK', 'PUBLISHER_COMPLAINT', 'PUBLISHER_OPT_OUT', 'EMERGENCY_SUPPRESSION');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'SUPPRESSED', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActorRole" AS ENUM ('REVIEWER', 'OPERATOR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SOURCE_DISABLED', 'SOURCE_ENABLED', 'EVENT_SUPPRESSED', 'EVENT_UNSUPPRESSED', 'CASE_ACKNOWLEDGED', 'CASE_RESOLVED', 'REVIEW_UPDATED', 'PUBLISH_PROMOTED');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "canonicalDomain" TEXT NOT NULL,
    "editorialBrand" TEXT NOT NULL,
    "ownershipName" TEXT,
    "ownershipType" "OwnershipType" NOT NULL DEFAULT 'UNKNOWN',
    "editorialType" "EditorialType" NOT NULL DEFAULT 'OTHER',
    "localityScope" "LocalityScope" NOT NULL DEFAULT 'NATIONAL',
    "primaryLanguage" "SourceLanguage" NOT NULL,
    "paywallStatus" "PaywallStatus" NOT NULL DEFAULT 'UNKNOWN',
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sourcePolicyNotes" TEXT,
    "independenceNotes" TEXT,
    "ingestMethod" "IngestMethod" NOT NULL DEFAULT 'RSS',
    "feedUrl" TEXT,
    "websiteUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceHealth" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "failureType" "FailureType",
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "disabledReason" TEXT,
    "staleWarningAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineRun" (
    "id" TEXT NOT NULL,
    "runType" "PipelineRunType" NOT NULL,
    "status" "PipelineRunStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "articleCount" INTEGER NOT NULL DEFAULT 0,
    "heldEventCount" INTEGER NOT NULL DEFAULT 0,
    "publishedEventCount" INTEGER NOT NULL DEFAULT 0,
    "modelProvider" TEXT,
    "modelVersion" TEXT,
    "errorSummary" TEXT,
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "ingestRunId" TEXT,
    "canonicalUrl" TEXT NOT NULL,
    "rawUrl" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "snippet" TEXT,
    "publishedAt" TIMESTAMP(3),
    "eventType" TEXT,
    "locations" JSONB,
    "extractedDatetime" TIMESTAMP(3),
    "actors" JSONB,
    "anchorKeywords" JSONB,
    "anchorConfidence" DOUBLE PRECISION,
    "anchorExtractionVersion" TEXT,
    "anchorExtractionStatus" TEXT,
    "anchorRaw" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "language" "SourceLanguage" NOT NULL,
    "paywallFlag" BOOLEAN NOT NULL DEFAULT false,
    "authorByline" TEXT,
    "articleHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "verificationKey" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "confidenceScore" DOUBLE PRECISION,
    "confidenceState" "ConfidenceState" NOT NULL DEFAULT 'REVIEW',
    "neutralTitle" TEXT,
    "aiTitle" TEXT,
    "firstSeenAt" TIMESTAMP(3),
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "publishRunId" TEXT,
    "publishedSnapshotId" TEXT,
    "lastReviewAt" TIMESTAMP(3),
    "suppressedAt" TIMESTAMP(3),
    "suppressionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventMembership" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "membershipRole" "MembershipRole" NOT NULL DEFAULT 'SUPPORTING',
    "membershipReason" TEXT,
    "evidenceSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFact" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "factType" TEXT NOT NULL,
    "textHe" TEXT NOT NULL,
    "confidenceState" "ConfidenceState" NOT NULL DEFAULT 'REVIEW',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFactSupport" (
    "id" TEXT NOT NULL,
    "eventFactId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "supportType" "SupportType" NOT NULL DEFAULT 'CONFIRMS',
    "excerpt" TEXT,

    CONSTRAINT "EventFactSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventReview" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "reviewStatus" "EventReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerRole" "ActorRole" NOT NULL DEFAULT 'REVIEWER',
    "reviewerRef" TEXT,
    "reviewerNote" TEXT,
    "correctedAt" TIMESTAMP(3),
    "correctedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectionReport" (
    "id" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "eventId" TEXT,
    "sourceId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CaseStatus" NOT NULL DEFAULT 'NEW',
    "payload" JSONB NOT NULL,
    "abuseScore" DOUBLE PRECISION,
    "contactEmail" TEXT,

    CONSTRAINT "CorrectionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorCase" (
    "id" TEXT NOT NULL,
    "caseType" "ReportType" NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'NEW',
    "reportId" TEXT,
    "eventId" TEXT,
    "sourceId" TEXT,
    "assignedRole" "ActorRole",
    "assignedTo" TEXT,
    "acknowledgementBy" TEXT,
    "acknowledgementAt" TIMESTAMP(3),
    "resolutionBy" TEXT,
    "resolutionAt" TIMESTAMP(3),
    "emergencySuppressedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishSnapshot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "pipelineRunId" TEXT NOT NULL,
    "publicStatus" "EventStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidenceState" "ConfidenceState" NOT NULL,
    "neutralTitle" TEXT,
    "warningLabel" TEXT,
    "feedRank" INTEGER,
    "snapshotVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorActionAudit" (
    "id" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "actorRole" "ActorRole" NOT NULL,
    "actorRef" TEXT,
    "reason" TEXT,
    "eventId" TEXT,
    "sourceId" TEXT,
    "operatorCaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorActionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_slug_key" ON "Source"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Source_canonicalDomain_key" ON "Source"("canonicalDomain");

-- CreateIndex
CREATE INDEX "Source_availabilityStatus_enabled_idx" ON "Source"("availabilityStatus", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "SourceHealth_sourceId_key" ON "SourceHealth"("sourceId");

-- CreateIndex
CREATE INDEX "PipelineRun_runType_status_idx" ON "PipelineRun"("runType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Article_canonicalUrl_key" ON "Article"("canonicalUrl");

-- CreateIndex
CREATE INDEX "Article_sourceId_publishedAt_idx" ON "Article"("sourceId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Event_publicId_key" ON "Event"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_verificationKey_key" ON "Event"("verificationKey");

-- CreateIndex
CREATE UNIQUE INDEX "Event_publishedSnapshotId_key" ON "Event"("publishedSnapshotId");

-- CreateIndex
CREATE INDEX "Event_status_confidenceState_idx" ON "Event"("status", "confidenceState");

-- CreateIndex
CREATE UNIQUE INDEX "EventMembership_eventId_articleId_key" ON "EventMembership"("eventId", "articleId");

-- CreateIndex
CREATE INDEX "EventFact_eventId_displayOrder_idx" ON "EventFact"("eventId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "EventFactSupport_eventFactId_articleId_key" ON "EventFactSupport"("eventFactId", "articleId");

-- CreateIndex
CREATE INDEX "EventReview_eventId_reviewStatus_idx" ON "EventReview"("eventId", "reviewStatus");

-- CreateIndex
CREATE INDEX "CorrectionReport_reportType_status_idx" ON "CorrectionReport"("reportType", "status");

-- CreateIndex
CREATE INDEX "OperatorCase_caseType_status_idx" ON "OperatorCase"("caseType", "status");

-- CreateIndex
CREATE INDEX "PublishSnapshot_pipelineRunId_publicStatus_idx" ON "PublishSnapshot"("pipelineRunId", "publicStatus");

-- CreateIndex
CREATE INDEX "OperatorActionAudit_actionType_createdAt_idx" ON "OperatorActionAudit"("actionType", "createdAt");

-- AddForeignKey
ALTER TABLE "SourceHealth" ADD CONSTRAINT "SourceHealth_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_ingestRunId_fkey" FOREIGN KEY ("ingestRunId") REFERENCES "PipelineRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_publishRunId_fkey" FOREIGN KEY ("publishRunId") REFERENCES "PipelineRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_publishedSnapshotId_fkey" FOREIGN KEY ("publishedSnapshotId") REFERENCES "PublishSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMembership" ADD CONSTRAINT "EventMembership_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMembership" ADD CONSTRAINT "EventMembership_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFact" ADD CONSTRAINT "EventFact_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFactSupport" ADD CONSTRAINT "EventFactSupport_eventFactId_fkey" FOREIGN KEY ("eventFactId") REFERENCES "EventFact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFactSupport" ADD CONSTRAINT "EventFactSupport_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventReview" ADD CONSTRAINT "EventReview_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionReport" ADD CONSTRAINT "CorrectionReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionReport" ADD CONSTRAINT "CorrectionReport_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorCase" ADD CONSTRAINT "OperatorCase_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CorrectionReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorCase" ADD CONSTRAINT "OperatorCase_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorCase" ADD CONSTRAINT "OperatorCase_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishSnapshot" ADD CONSTRAINT "PublishSnapshot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishSnapshot" ADD CONSTRAINT "PublishSnapshot_pipelineRunId_fkey" FOREIGN KEY ("pipelineRunId") REFERENCES "PipelineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorActionAudit" ADD CONSTRAINT "OperatorActionAudit_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorActionAudit" ADD CONSTRAINT "OperatorActionAudit_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorActionAudit" ADD CONSTRAINT "OperatorActionAudit_operatorCaseId_fkey" FOREIGN KEY ("operatorCaseId") REFERENCES "OperatorCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

