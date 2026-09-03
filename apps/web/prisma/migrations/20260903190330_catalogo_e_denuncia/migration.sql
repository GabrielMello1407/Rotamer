-- AlterTable
ALTER TABLE "TeacherQuest" ADD COLUMN     "catalogedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "QuestReport" (
    "id" TEXT NOT NULL,
    "questSlug" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "QuestReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestReport_questSlug_idx" ON "QuestReport"("questSlug");

-- AddForeignKey
ALTER TABLE "QuestReport" ADD CONSTRAINT "QuestReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
