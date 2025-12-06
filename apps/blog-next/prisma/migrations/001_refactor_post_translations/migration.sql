-- Remove foreign key constraints first
ALTER TABLE "PostCategory" DROP CONSTRAINT IF EXISTS "PostCategory_postId_fkey";
ALTER TABLE "PostTag" DROP CONSTRAINT IF EXISTS "PostTag_postId_fkey";

-- Add new columns to Post
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "locale" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "summary" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "content" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;

-- Migrate data from PostTranslation to Post
-- This assumes we only have English posts for now
UPDATE "Post" SET 
  "locale" = COALESCE((SELECT locale FROM "PostTranslation" WHERE "postId" = "Post"."id" LIMIT 1), 'en'),
  "title" = COALESCE((SELECT title FROM "PostTranslation" WHERE "postId" = "Post"."id" LIMIT 1), 'Untitled'),
  "summary" = (SELECT summary FROM "PostTranslation" WHERE "postId" = "Post"."id" LIMIT 1),
  "content" = COALESCE((SELECT content FROM "PostTranslation" WHERE "postId" = "Post"."id" LIMIT 1), ''),
  "seoTitle" = (SELECT "seoTitle" FROM "PostTranslation" WHERE "postId" = "Post"."id" LIMIT 1),
  "seoDescription" = (SELECT "seoDescription" FROM "PostTranslation" WHERE "postId" = "Post"."id" LIMIT 1);

-- Set locale default for any null values
UPDATE "Post" SET "locale" = 'en' WHERE "locale" IS NULL;

-- Make columns NOT NULL
ALTER TABLE "Post" ALTER COLUMN "locale" SET NOT NULL;
ALTER TABLE "Post" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "Post" ALTER COLUMN "content" SET NOT NULL;

-- Drop the unique constraint on slug
ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_slug_key";

-- Add new unique constraint on (slug, locale)
ALTER TABLE "Post" ADD CONSTRAINT "Post_slug_locale_key" UNIQUE ("slug", "locale");

-- Re-add foreign key constraints
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_postId_fkey" 
  FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_postId_fkey" 
  FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop the PostTranslation table
DROP TABLE IF EXISTS "PostTranslation";
