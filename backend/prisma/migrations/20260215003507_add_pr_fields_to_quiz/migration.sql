/*
  Warnings:

  - Added the required column `issueNumber` to the `Quiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner` to the `Quiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repo` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quiz" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "githubUserId" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "issueNumber" INTEGER NOT NULL
);
INSERT INTO "new_Quiz" ("githubUserId", "id") SELECT "githubUserId", "id" FROM "Quiz";
DROP TABLE "Quiz";
ALTER TABLE "new_Quiz" RENAME TO "Quiz";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
