/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "githubUserId" INTEGER NOT NULL,
    "githubUserLogin" TEXT NOT NULL
);
INSERT INTO "new_User" ("githubUserId", "githubUserLogin", "id", "name") SELECT "githubUserId", "githubUserLogin", "id", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_githubUserId_key" ON "User"("githubUserId");
CREATE UNIQUE INDEX "User_githubUserLogin_key" ON "User"("githubUserLogin");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
