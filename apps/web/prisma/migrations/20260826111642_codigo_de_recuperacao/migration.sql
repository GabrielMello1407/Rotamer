-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'aluno';

-- CreateTable
CREATE TABLE "ResetCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResetCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResetCode_codeHash_key" ON "ResetCode"("codeHash");

-- CreateIndex
CREATE INDEX "ResetCode_profileId_idx" ON "ResetCode"("profileId");

-- CreateIndex
CREATE INDEX "ResetCode_expiresAt_idx" ON "ResetCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "ResetCode" ADD CONSTRAINT "ResetCode_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResetCode" ADD CONSTRAINT "ResetCode_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
