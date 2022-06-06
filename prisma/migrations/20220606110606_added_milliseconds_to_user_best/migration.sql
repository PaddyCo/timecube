/*
  Warnings:

  - Added the required column `milliseconds` to the `UserBest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserBest" ADD COLUMN     "milliseconds" INTEGER NOT NULL;
