-- CreateTable
CREATE TABLE "StatusConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nextStep" TEXT,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isContractSigned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StatusConfig_name_key" ON "StatusConfig"("name");
