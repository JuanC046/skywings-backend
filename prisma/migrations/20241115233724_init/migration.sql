/*
  Warnings:

  - Added the required column `creationDate` to the `ticket` table without a default value. This is not possible if the table is not empty.
  - Made the column `erased` on table `ticket` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_flightCode_passangerDni_fkey";

-- AlterTable
ALTER TABLE "ticket" ADD COLUMN     "creationDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "numSuitcase" DROP NOT NULL,
ALTER COLUMN "erased" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_flightCode_fkey" FOREIGN KEY ("flightCode") REFERENCES "flight"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
