"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { FileText, FolderOpen, Tag, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SupportedLocale } from "@/config/site"

type Stats = {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalCategories: number
  totalTags: number
  recentPosts: Array<{
    id: string
    slug: string
    locale: string
    title: string
    status: string
    updatedAt: string
  }>
}

export function AdminDashboard({ locale }: { locale: SupportedLocale }) {
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalCategories: 0,
    totalTags: 0,
    recentPosts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const [postsRes, categoriesRes, tagsRes] = await Promise.all([
        fetch("/api/posts", { credentials: "same-origin" }),
        fetch("/api/categories", { credentials: "same-origin" }),
        fetch("/api/tags", { credentials: "same-origin" })
      ])

      const posts = postsRes.ok ? await postsRes.json() : []
      const categories = categoriesRes.ok ? await categoriesRes.json() : []
      const tags = tagsRes.ok ? await tagsRes.json() : []

      setStats({
        totalPosts: posts.length,
        publishedPosts: posts.filter((p: any) => p.status === "PUBLISHED").length,
        draftPosts: posts.filter((p: any) => p.status === "DRAFT").length,
        totalCategories: categories.length,
        totalTags: tags.length,
        recentPosts: posts.slice(0, 5)
      })
    } catch (error) {
      console.error("Failed to load stats:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Badge variant="muted" className="uppercase tracking-wide">Dashboard</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Content Overview</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Monitor your blog content, track publishing activity, and manage your editorial workflow.
        </p>
      </section>

      {/* Statistics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedPosts} published, {stats.draftPosts} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.publishedPosts}</div>
            <p className="text-xs text-muted-foreground">
              Live on the site
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Content organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalTags}</div>
            <p className="text-xs text-muted-foreground">
              Content metadata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Your latest content updates</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : stats.recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts yet. Create your first post!</p>
            ) : (
              <div className="space-y-4">
                {stats.recentPosts
                  .filter(post => post.locale === locale)
                  .map((post) => {
                    return (
                      <div key={post.id} className="flex items-start justify-between gap-4 rounded-lg border border-border/50 p-3">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{post.title || post.slug}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.updatedAt).toLocaleDateString()} • {post.slug}
                          </p>
                        </div>
                        <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                          {post.status}
                        </Badge>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common editorial tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={`/${locale}/admin/posts`}>
                <FileText className="mr-2 h-4 w-4" />
                Manage Posts
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={`/${locale}/admin/categories`}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Manage Categories
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={`/${locale}/admin/tags`}>
                <Tag className="mr-2 h-4 w-4" />
                Manage Tags
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={`/${locale}`}>
                <TrendingUp className="mr-2 h-4 w-4" />
                View Public Site
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* SEO Tips */}
      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle>SEO Best Practices</CardTitle>
          <CardDescription>Tips to improve content discoverability</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Write compelling summaries under 160 characters for better search previews</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use descriptive slugs that include relevant keywords</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Organize content with categories to improve site structure</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Add tags for better content discovery and related post suggestions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Keep draft content until it's fully reviewed and ready to publish</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
