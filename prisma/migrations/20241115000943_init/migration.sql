/*
  Warnings:

  - Changed the type of `seatNumber` on the `ticket` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ticket" DROP COLUMN "seatNumber",
ADD COLUMN     "seatNumber" INTEGER NOT NULL,
ALTER COLUMN "checkIn" DROP NOT NULL;
