-- CreateTable
CREATE TABLE "TeacherQuest" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "hints" JSONB NOT NULL,
    "goals" JSONB NOT NULL,
    "answerMolblock" TEXT NOT NULL,
    "answerInchiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "TeacherQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentItem" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "questSlug" TEXT NOT NULL,

    CONSTRAINT "AssignmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherQuest_teacherId_idx" ON "TeacherQuest"("teacherId");

-- CreateIndex
CREATE INDEX "Assignment_classroomId_idx" ON "Assignment"("classroomId");

-- CreateIndex
CREATE INDEX "AssignmentItem_questSlug_idx" ON "AssignmentItem"("questSlug");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentItem_assignmentId_position_key" ON "AssignmentItem"("assignmentId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentItem_assignmentId_questSlug_key" ON "AssignmentItem"("assignmentId", "questSlug");

-- AddForeignKey
ALTER TABLE "TeacherQuest" ADD CONSTRAINT "TeacherQuest_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentItem" ADD CONSTRAINT "AssignmentItem_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
