-- CreateTable
CREATE TABLE "MoleculeName" (
    "inchiKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "smiles" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoleculeName_pkey" PRIMARY KEY ("inchiKey")
);

-- CreateIndex
CREATE INDEX "MoleculeName_profileId_idx" ON "MoleculeName"("profileId");

-- CreateIndex
CREATE INDEX "MoleculeName_createdAt_idx" ON "MoleculeName"("createdAt");

-- AddForeignKey
ALTER TABLE "MoleculeName" ADD CONSTRAINT "MoleculeName_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
