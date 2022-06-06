-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('LOCAL');

-- CreateEnum
CREATE TYPE "BestCategory" AS ENUM ('SINGLE', 'AO5', 'AO12', 'AO100', 'MO3');

-- CreateTable
CREATE TABLE "PuzzleType" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PuzzleType_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "Time" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "milliseconds" INTEGER NOT NULL,
    "penalty" INTEGER NOT NULL DEFAULT 0,
    "dnf" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "puzzleTypeSlug" TEXT NOT NULL,

    CONSTRAINT "Time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthMethod" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AuthType" NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "AuthMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBest" (
    "userId" TEXT NOT NULL,
    "category" "BestCategory" NOT NULL,
    "timeId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleType_slug_key" ON "PuzzleType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserBest_userId_timeId_category_key" ON "UserBest"("userId", "timeId", "category");

-- AddForeignKey
ALTER TABLE "Time" ADD CONSTRAINT "Time_puzzleTypeSlug_fkey" FOREIGN KEY ("puzzleTypeSlug") REFERENCES "PuzzleType"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Time" ADD CONSTRAINT "Time_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthMethod" ADD CONSTRAINT "AuthMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBest" ADD CONSTRAINT "UserBest_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "Time"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBest" ADD CONSTRAINT "UserBest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
