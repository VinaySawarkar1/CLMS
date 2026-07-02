-- AlterTable: add currentSessionToken to User
ALTER TABLE "User" ADD COLUMN "currentSessionToken" TEXT;
