-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('UNSUBSCRIBE', 'CONFIRMATION');

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "SubscriptionToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionToken_token_key" ON "SubscriptionToken"("token");

-- CreateIndex
CREATE INDEX "SubscriptionToken_token_idx" ON "SubscriptionToken"("token");

-- AddForeignKey
ALTER TABLE "SubscriptionToken" ADD CONSTRAINT "SubscriptionToken_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
