-- Remove the old slug unique constraint to allow same slug for different locales
ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_slug_key";
