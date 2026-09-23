-- PostgreSQL Schema Migration Script for Google OAuth
-- This introduces Google Authentication fields to the "User" table

-- 1. Alter passwordHash to be nullable (Google users don't need passwords)
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- 2. Add googleId column and make it unique
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- 3. Add isVerified column (Google emails are pre-verified)
ALTER TABLE "User" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- Note: avatarUrl might already exist as "avatarUrl" TEXT, 
-- but if it didn't, we would run:
-- ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
