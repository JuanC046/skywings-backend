/*
  Warnings:

  - Added the required column `flightCode` to the `passenger` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "passenger_dni_key";

-- AlterTable
ALTER TABLE "passenger" ADD COLUMN     "flightCode" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "passenger_flightCode_fkey" FOREIGN KEY ("flightCode") REFERENCES "flight"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
