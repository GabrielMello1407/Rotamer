-- CreateTable
CREATE TABLE "PubChemName" (
    "query" TEXT NOT NULL,
    "found" BOOLEAN NOT NULL,
    "cid" INTEGER,
    "smiles" TEXT,
    "title" TEXT,
    "formula" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PubChemName_pkey" PRIMARY KEY ("query")
);

-- CreateTable
CREATE TABLE "PubChemKnown" (
    "inchiKey" TEXT NOT NULL,
    "known" BOOLEAN NOT NULL,
    "cid" INTEGER,
    "title" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PubChemKnown_pkey" PRIMARY KEY ("inchiKey")
);
