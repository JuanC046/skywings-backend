-- CreateTable
CREATE TABLE "User" (
    "username" TEXT NOT NULL,
    "numberLogins" INTEGER NOT NULL DEFAULT 0,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "dni" TEXT,
    "name1" TEXT,
    "name2" TEXT,
    "surname1" TEXT,
    "surname2" TEXT,
    "gender" TEXT,
    "address" TEXT,
    "birthPlace" TEXT,
    "birthDate" TIMESTAMP(3),
    "image" TEXT,
    "erased" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "flight" (
    "code" TEXT NOT NULL,
    "creator" TEXT NOT NULL,
    "updater" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "priceFirstClass" DOUBLE PRECISION NOT NULL,
    "priceEconomyClass" DOUBLE PRECISION NOT NULL,
    "flightTime" TEXT NOT NULL,
    "departureDate1" TIMESTAMP(3) NOT NULL,
    "arrivalDate1" TIMESTAMP(3) NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL,
    "lastUpdateDate" TIMESTAMP(3) NOT NULL,
    "erased" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "flight_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "news" (
    "id" SERIAL NOT NULL,
    "flightCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL,
    "erased" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats" (
    "flightCode" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "totalFirst" INTEGER NOT NULL,
    "totalTourist" INTEGER NOT NULL,
    "avaliableFirst" TEXT NOT NULL,
    "avaliableTourist" TEXT NOT NULL,
    "busyFirst" TEXT NOT NULL,
    "busyTourist" TEXT NOT NULL,
    "erased" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("flightCode")
);

-- CreateTable
CREATE TABLE "passenger" (
    "dni" TEXT NOT NULL,
    "flightCode" TEXT NOT NULL,
    "name1" TEXT NOT NULL,
    "name2" TEXT,
    "surname1" TEXT NOT NULL,
    "surname2" TEXT,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "erased" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "passenger_pkey" PRIMARY KEY ("dni","flightCode")
);

-- CreateTable
CREATE TABLE "ticket" (
    "flightCode" TEXT NOT NULL,
    "passengerDni" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "purchaseId" INTEGER NOT NULL DEFAULT 0,
    "seatNumber" INTEGER NOT NULL,
    "seatChanged" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL,
    "checkIn" TIMESTAMP(3),
    "numSuitcase" INTEGER NOT NULL,
    "erased" BOOLEAN DEFAULT false,

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("flightCode","passengerDni")
);

-- CreateTable
CREATE TABLE "cards" (
    "number" TEXT NOT NULL,
    "propietary" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "cvv" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "erased" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_dni_key" ON "User"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "flight_code_key" ON "flight"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cards_number_key" ON "cards"("number");

-- AddForeignKey
ALTER TABLE "flight" ADD CONSTRAINT "flight_creator_fkey" FOREIGN KEY ("creator") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_flightCode_fkey" FOREIGN KEY ("flightCode") REFERENCES "flight"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_flightCode_fkey" FOREIGN KEY ("flightCode") REFERENCES "flight"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "passenger_flightCode_fkey" FOREIGN KEY ("flightCode") REFERENCES "flight"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_flightCode_passengerDni_fkey" FOREIGN KEY ("flightCode", "passengerDni") REFERENCES "passenger"("flightCode", "dni") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_propietary_fkey" FOREIGN KEY ("propietary") REFERENCES "User"("dni") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_cardNumber_fkey" FOREIGN KEY ("cardNumber") REFERENCES "cards"("number") ON DELETE RESTRICT ON UPDATE CASCADE;
