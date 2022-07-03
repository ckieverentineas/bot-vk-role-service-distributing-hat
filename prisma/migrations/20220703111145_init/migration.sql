-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "idvk" INTEGER NOT NULL,
    "id_user_type" INTEGER NOT NULL,
    "gold" INTEGER NOT NULL,
    "crdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "crdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facult" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "crdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Facult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserType_name_key" ON "UserType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Facult_name_key" ON "Facult"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_id_user_type_fkey" FOREIGN KEY ("id_user_type") REFERENCES "UserType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
