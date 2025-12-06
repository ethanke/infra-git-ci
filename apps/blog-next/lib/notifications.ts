import { PrismaClient } from '@prisma/client';
import { sendEmail, createNewArticleTemplate, getUnsubscribeUrl } from './email';

const prisma = new PrismaClient();

export interface PostData {
  id: string;
  title: string;
  summary: string | null;
  slug: string;
  locale: string;
}

export async function notifySubscribersOfNewPost(post: PostData): Promise<void> {
  try {
    // Get all active subscribers
    const subscribers = await prisma.subscriber.findMany({
      where: { isActive: true },
      include: {
        tokens: {
          where: {
            type: 'UNSUBSCRIBE',
            expiresAt: { gt: new Date() },
            usedAt: null,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (subscribers.length === 0) {
      console.log('No active subscribers to notify');
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const postUrl = `${baseUrl}/${post.locale}/posts/${post.slug}`;

    // Send email to each subscriber
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const unsubscribeToken = subscriber.tokens[0];
        if (!unsubscribeToken) {
          console.warn(`No valid unsubscribe token for subscriber ${subscriber.email}`);
          return;
        }

        const unsubscribeUrl = getUnsubscribeUrl(unsubscribeToken.token, baseUrl);
        const template = createNewArticleTemplate(
          post.title,
          post.summary || 'Read the full article to learn more.',
          postUrl,
          unsubscribeUrl
        );

        await sendEmail(subscriber.email, template);
        console.log(`Notification sent to ${subscriber.email}`);
      } catch (error) {
        console.error(`Failed to send notification to ${subscriber.email}:`, error);
      }
    });

    await Promise.allSettled(emailPromises);
    console.log(`Notifications sent to ${subscribers.length} subscribers`);
  } catch (error) {
    console.error('Failed to notify subscribers:', error);
    throw error;
  }
}

export async function getSubscriberCount(): Promise<number> {
  return await prisma.subscriber.count({
    where: { isActive: true },
  });
}
