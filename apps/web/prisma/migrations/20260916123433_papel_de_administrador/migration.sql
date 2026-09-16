-- CreateTable
CREATE TABLE "RoleChange" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "changedById" TEXT,
    "fromRole" TEXT NOT NULL,
    "toRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoleChange_profileId_idx" ON "RoleChange"("profileId");

-- CreateIndex
CREATE INDEX "RoleChange_changedById_idx" ON "RoleChange"("changedById");

-- AddForeignKey
ALTER TABLE "RoleChange" ADD CONSTRAINT "RoleChange_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleChange" ADD CONSTRAINT "RoleChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
