import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Unsubscribe token is required' },
        { status: 400 }
      );
    }

    // Find the token and check if it's valid
    const subscriptionToken = await prisma.subscriptionToken.findUnique({
      where: { token },
      include: { subscriber: true },
    });

    if (!subscriptionToken) {
      return NextResponse.json(
        { message: 'Invalid unsubscribe token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (subscriptionToken.expiresAt < new Date()) {
      return NextResponse.json(
        { message: 'Unsubscribe token has expired' },
        { status: 400 }
      );
    }

    // Check if token has already been used
    if (subscriptionToken.usedAt) {
      return NextResponse.json(
        { message: 'This unsubscribe link has already been used' },
        { status: 400 }
      );
    }

    // Mark token as used and deactivate subscriber
    await prisma.$transaction([
      prisma.subscriptionToken.update({
        where: { id: subscriptionToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.subscriber.update({
        where: { id: subscriptionToken.subscriberId },
        data: { isActive: false },
      }),
    ]);

    return NextResponse.json({
      message: 'Successfully unsubscribed from the newsletter.',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { message: 'Failed to unsubscribe. Please try again later.' },
      { status: 500 }
    );
  }
}
