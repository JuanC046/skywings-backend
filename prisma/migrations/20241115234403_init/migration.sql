/*
  Warnings:

  - You are about to drop the column `creationDate` on the `ticket` table. All the data in the column will be lost.
  - Made the column `numSuitcase` on table `ticket` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_flightCode_fkey";

-- AlterTable
ALTER TABLE "ticket" DROP COLUMN "creationDate",
ALTER COLUMN "numSuitcase" SET NOT NULL,
ALTER COLUMN "erased" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_flightCode_passengerDni_fkey" FOREIGN KEY ("flightCode", "passengerDni") REFERENCES "passenger"("flightCode", "dni") ON DELETE RESTRICT ON UPDATE CASCADE;
