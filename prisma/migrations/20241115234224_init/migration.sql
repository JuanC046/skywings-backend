/*
  Warnings:

  - The primary key for the `ticket` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `passangerDni` on the `ticket` table. All the data in the column will be lost.
  - Added the required column `passengerDni` to the `ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_pkey",
DROP COLUMN "passangerDni",
ADD COLUMN     "passengerDni" TEXT NOT NULL,
ADD CONSTRAINT "ticket_pkey" PRIMARY KEY ("flightCode", "passengerDni");
