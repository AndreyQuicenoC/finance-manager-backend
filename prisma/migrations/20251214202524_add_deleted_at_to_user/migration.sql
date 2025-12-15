-- AlterTable: Add deletedAt column to User table for soft delete functionality
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
