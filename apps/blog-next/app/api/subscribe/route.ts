import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = subscribeSchema.parse(body);

    // Check if subscriber already exists
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return NextResponse.json(
          { message: 'You are already subscribed to our newsletter.' },
          { status: 400 }
        );
      } else {
        // Reactivate subscription
        await prisma.subscriber.update({
          where: { id: existingSubscriber.id },
          data: { isActive: true },
        });
      }
    } else {
      // Create new subscriber
      await prisma.subscriber.create({
        data: { email },
      });
    }

    // Generate unsubscribe token
    const { generateSecureToken } = await import('@/lib/email');
    const token = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Token expires in 30 days

    // Create subscription token
    await prisma.subscriptionToken.create({
      data: {
        token,
        subscriberId: existingSubscriber?.id || (await prisma.subscriber.findUnique({ where: { email } }))!.id,
        type: 'UNSUBSCRIBE',
        expiresAt,
      },
    });

    // Send confirmation email
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const { getUnsubscribeUrl, createSubscriptionConfirmationTemplate, sendEmail } = await import('@/lib/email');
    const unsubscribeUrl = getUnsubscribeUrl(token, baseUrl);
    const template = createSubscriptionConfirmationTemplate(unsubscribeUrl);

    await sendEmail(email, template);

    return NextResponse.json({
      message: 'Successfully subscribed! Please check your email for confirmation.',
    });
  } catch (error) {
    console.error('Subscription error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid email address' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    );
  }
}
