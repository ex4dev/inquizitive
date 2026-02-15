/*
  Warnings:

  - Added the required column `installationId` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quiz" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "githubUserId" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "issueNumber" INTEGER NOT NULL,
    "prName" TEXT NOT NULL,
    "installationId" INTEGER NOT NULL
);
INSERT INTO "new_Quiz" ("githubUserId", "id", "issueNumber", "owner", "prName", "repo") SELECT "githubUserId", "id", "issueNumber", "owner", "prName", "repo" FROM "Quiz";
DROP TABLE "Quiz";
ALTER TABLE "new_Quiz" RENAME TO "Quiz";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
