/*
  Warnings:

  - The primary key for the `passenger` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ticket` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `passengerDni` on the `ticket` table. All the data in the column will be lost.
  - Added the required column `passangerDni` to the `ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_flightCode_fkey";

-- DropForeignKey
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_passengerDni_fkey";

-- AlterTable
ALTER TABLE "passenger" DROP CONSTRAINT "passenger_pkey",
ADD CONSTRAINT "passenger_pkey" PRIMARY KEY ("dni", "flightCode");

-- AlterTable
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_pkey",
DROP COLUMN "passengerDni",
ADD COLUMN     "passangerDni" TEXT NOT NULL,
ADD CONSTRAINT "ticket_pkey" PRIMARY KEY ("flightCode", "passangerDni");

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_flightCode_passangerDni_fkey" FOREIGN KEY ("flightCode", "passangerDni") REFERENCES "passenger"("flightCode", "dni") ON DELETE RESTRICT ON UPDATE CASCADE;
