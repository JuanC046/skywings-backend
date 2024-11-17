/*
  Warnings:

  - You are about to drop the column `paymentId` on the `purchases` table. All the data in the column will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cardNumber` to the `purchases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `purchases` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_cardNumber_fkey";

-- DropForeignKey
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_paymentId_fkey";

-- AlterTable
ALTER TABLE "purchases" DROP COLUMN "paymentId",
ADD COLUMN     "cardNumber" TEXT NOT NULL,
ADD COLUMN     "total" INTEGER NOT NULL,
ALTER COLUMN "status" DROP NOT NULL;

-- DropTable
DROP TABLE "payments";

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_cardNumber_fkey" FOREIGN KEY ("cardNumber") REFERENCES "cards"("number") ON DELETE RESTRICT ON UPDATE CASCADE;
