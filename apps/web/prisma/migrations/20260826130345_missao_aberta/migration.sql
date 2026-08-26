-- CreateTable
CREATE TABLE "QuestOpen" (
    "profileId" TEXT NOT NULL,
    "questSlug" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestOpen_pkey" PRIMARY KEY ("profileId","questSlug")
);

-- CreateIndex
CREATE INDEX "QuestOpen_questSlug_idx" ON "QuestOpen"("questSlug");

-- AddForeignKey
ALTER TABLE "QuestOpen" ADD CONSTRAINT "QuestOpen_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
