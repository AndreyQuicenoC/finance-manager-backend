/*
  Warnings:

  - You are about to drop the column `Isincome` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `tagPocketId` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `goalUnitId` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `tagId` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the `Chat_recommendation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GoalUnit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notifications` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,deviceId]` on the table `UserSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountId` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `max_money` to the `Goal` table without a default value. This is not possible if the table is not empty.
  - Made the column `init_date` on table `Goal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `final_date` on table `Goal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `actual_progress` on table `Goal` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `roleId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_tagPocketId_fkey";

-- DropForeignKey
ALTER TABLE "Chat_recommendation" DROP CONSTRAINT "Chat_recommendation_chatId_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_goalUnitId_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_tagId_fkey";

-- DropForeignKey
ALTER TABLE "Notifications" DROP CONSTRAINT "Notifications_tagPocketId_fkey";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "Isincome";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "tagPocketId",
ADD COLUMN     "accountId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "goalUnitId",
DROP COLUMN "tagId",
ADD COLUMN     "max_money" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "init_date" SET NOT NULL,
ALTER COLUMN "final_date" SET NOT NULL,
ALTER COLUMN "actual_progress" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roleId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Chat_recommendation";

-- DropTable
DROP TABLE "GoalUnit";

-- DropTable
DROP TABLE "Notifications";

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalTarget" (
    "id" SERIAL NOT NULL,
    "goalId" INTEGER NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL,

    CONSTRAINT "GoalTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "message_send" TEXT NOT NULL,
    "answers_message" TEXT NOT NULL,
    "chatId" INTEGER NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_userId_deviceId_key" ON "UserSession"("userId", "deviceId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalTarget" ADD CONSTRAINT "GoalTarget_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
