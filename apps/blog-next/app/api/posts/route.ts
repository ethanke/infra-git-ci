import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

import { isAdminRequest } from '@/lib/admin-auth'

export async function GET() {
  const posts = await prisma.post.findMany({ 
    include: { 
      categories: {
        include: { category: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const { title, summary, content, locale = 'en', slug, status = 'DRAFT' } = await req.json()
  const safeSlug = slug || title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  if (!safeSlug) {
    return new NextResponse('Missing title or slug', { status: 400 })
  }

  const existing = await prisma.post.findUnique({
    where: { slug_locale: { slug: safeSlug, locale } },
    select: {
      id: true
    }
  })

  let post

  let wasPublished = false;
  let isNewPost = false;

  if (existing) {
    // Check if this is transitioning from DRAFT to PUBLISHED
    const currentPost = await prisma.post.findUnique({
      where: { id: existing.id },
      select: { status: true }
    });
    wasPublished = currentPost?.status === 'PUBLISHED';
    
    post = await prisma.post.update({
      where: { id: existing.id },
      data: {
        title,
        summary: summary ?? null,
        content,
        status: status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
      }
    })
  } else {
    isNewPost = true;
    post = await prisma.post.create({
      data: {
        slug: safeSlug,
        locale,
        title,
        summary: summary ?? null,
        content,
        status: status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
      }
    })
  }

  // Send notifications if this is a newly published post
  if (status === 'PUBLISHED' && (isNewPost || !wasPublished)) {
    try {
      const { notifySubscribersOfNewPost } = await import('@/lib/notifications');
      await notifySubscribersOfNewPost({
        id: post.id,
        title: post.title,
        summary: post.summary,
        slug: post.slug,
        locale: post.locale,
      });
    } catch (error) {
      console.error('Failed to send notifications:', error);
      // Don't fail the request if notifications fail
    }
  }

  return NextResponse.json({ ok: true, post })
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  const { id, title, summary, content, status } = await req.json()
  
  if (!id) {
    return new NextResponse('Missing post ID', { status: 400 })
  }

  try {
    // Check if this is transitioning from DRAFT to PUBLISHED
    const currentPost = await prisma.post.findUnique({
      where: { id },
      select: { status: true }
    });
    const wasPublished = currentPost?.status === 'PUBLISHED';

    const data: any = {
      title,
      summary: summary ?? null,
      content
    }

    if (status) {
      data.status = status
    }

    const post = await prisma.post.update({
      where: { id },
      data
    })

    // Send notifications if this is transitioning to PUBLISHED
    if (status === 'PUBLISHED' && !wasPublished) {
      try {
        const { notifySubscribersOfNewPost } = await import('@/lib/notifications');
        await notifySubscribersOfNewPost({
          id: post.id,
          title: post.title,
          summary: post.summary,
          slug: post.slug,
          locale: post.locale,
        });
      } catch (error) {
        console.error('Failed to send notifications:', error);
        // Don't fail the request if notifications fail
      }
    }

    return NextResponse.json({ ok: true, post })
  } catch (error) {
    console.error('Failed to update post:', error)
    return new NextResponse('Failed to update post', { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return new NextResponse('Missing post ID', { status: 400 })
  }

  try {
    // Delete related records first due to foreign key constraints
    await prisma.postTag.deleteMany({
      where: { postId: id }
    })
    
    await prisma.postCategory.deleteMany({
      where: { postId: id }
    })

    // Now delete the post
    await prisma.post.delete({
      where: { id }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete post:', error)
    return new NextResponse('Failed to delete post', { status: 500 })
  }
}
