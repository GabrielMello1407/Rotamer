-- CreateTable
CREATE TABLE "TutorHint" (
    "id" TEXT NOT NULL,
    "inchiKey" TEXT NOT NULL,
    "questSlug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorHint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorUsage" (
    "profileId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TutorUsage_pkey" PRIMARY KEY ("profileId","day")
);

-- CreateIndex
CREATE INDEX "TutorHint_createdAt_idx" ON "TutorHint"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TutorHint_inchiKey_questSlug_kind_key" ON "TutorHint"("inchiKey", "questSlug", "kind");

-- AddForeignKey
ALTER TABLE "TutorUsage" ADD CONSTRAINT "TutorUsage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
