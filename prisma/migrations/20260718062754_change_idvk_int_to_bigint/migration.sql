/*
  Warnings:

  - You are about to alter the column `idvk` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "coga" INTEGER NOT NULL,
    "puff" INTEGER NOT NULL,
    "grif" INTEGER NOT NULL,
    "sliz" INTEGER NOT NULL,
    "facult" TEXT NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("coga", "crdate", "facult", "grif", "id", "idvk", "name", "puff", "sliz") SELECT "coga", "crdate", "facult", "grif", "id", "idvk", "name", "puff", "sliz" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
