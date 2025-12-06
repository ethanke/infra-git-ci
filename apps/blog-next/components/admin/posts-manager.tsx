"use client"

import { useState, useEffect } from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import { useRouter } from "next/navigation"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  LinkIcon,
  Code2,
  Minus,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SupportedLocale } from "@/config/site"

// Editor Toolbar Component
function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null

  const addLink = () => {
    const url = window.prompt("Enter URL:")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border/60 p-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "bg-muted" : ""}
        type="button"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "bg-muted" : ""}
        type="button"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive("strike") ? "bg-muted" : ""}
        type="button"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={editor.isActive("code") ? "bg-muted" : ""}
        type="button"
      >
        <Code className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border/60 mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
        type="button"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
        type="button"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""}
        type="button"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border/60 mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "bg-muted" : ""}
        type="button"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "bg-muted" : ""}
        type="button"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive("blockquote") ? "bg-muted" : ""}
        type="button"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive("codeBlock") ? "bg-muted" : ""}
        type="button"
      >
        <Code2 className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border/60 mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={addLink}
        className={editor.isActive("link") ? "bg-muted" : ""}
        type="button"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        type="button"
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border/60 mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        type="button"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        type="button"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  )
}

type Post = {
  id: string
  slug: string
  locale: string
  title: string
  summary: string | null
  content: string
  status: "DRAFT" | "PUBLISHED"
  createdAt: string
  updatedAt: string
}

type Status = "idle" | "loading" | "saving" | "success" | "error"

export function PostsManager({ locale }: { locale: SupportedLocale }) {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [slug, setSlug] = useState("")
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT")
  const [actionStatus, setActionStatus] = useState<Status>("idle")
  
  const editor = useEditor({ 
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" }
      })
    ], 
    content: "<p>Start writing your post...</p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[400px] focus:outline-none"
      }
    }
  })

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    try {
      const response = await fetch("/api/posts", {
        credentials: "same-origin"
      })
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error("Failed to load posts:", error)
    }
  }

  async function handleCreate() {
    if (!title.trim()) {
      setActionStatus("error")
      return
    }
    
    setActionStatus("saving")
    const content = editor?.getHTML() || ""
    
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ title, summary, content, locale, slug, status })
    })

    if (response.ok) {
      setActionStatus("success")
      setIsCreateDialogOpen(false)
      resetForm()
      loadPosts()
      router.refresh()
    } else {
      setActionStatus("error")
    }
  }

  async function handleEdit() {
    if (!selectedPost || !title.trim()) {
      setActionStatus("error")
      return
    }

    setActionStatus("saving")
    const content = editor?.getHTML() || ""

    const response = await fetch("/api/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ 
        id: selectedPost.id, 
        title, 
        summary, 
        content, 
        locale, 
        status 
      })
    })

    if (response.ok) {
      setActionStatus("success")
      setIsEditDialogOpen(false)
      resetForm()
      loadPosts()
      router.refresh()
    } else {
      setActionStatus("error")
    }
  }

  async function handleDelete() {
    if (!selectedPost) return

    setActionStatus("saving")
    const response = await fetch(`/api/posts?id=${selectedPost.id}`, {
      method: "DELETE",
      credentials: "same-origin"
    })

    if (response.ok) {
      setActionStatus("success")
      setIsDeleteDialogOpen(false)
      setSelectedPost(null)
      loadPosts()
      router.refresh()
    } else {
      setActionStatus("error")
    }
  }

  function openEditDialog(post: Post) {
    setSelectedPost(post)
    if (post) {
      setTitle(post.title)
      setSummary(post.summary || "")
      setSlug(post.slug)
      setStatus(post.status)
      editor?.commands.setContent(post.content)
    }
    setIsEditDialogOpen(true)
  }

  function resetForm() {
    setTitle("")
    setSummary("")
    setSlug("")
    setStatus("DRAFT")
    editor?.commands.setContent("<p>Start writing your post...</p>")
    setActionStatus("idle")
  }

  function openDeleteDialog(post: Post) {
    setSelectedPost(post)
    setIsDeleteDialogOpen(true)
  }

  const currentLocalePosts = posts.filter(post => post.locale === locale)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Manage Posts</h2>
          <p className="text-sm text-muted-foreground">Create, edit, and publish blog posts</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true) }}>
          + Create Post
        </Button>
      </div>

      <div className="grid gap-4">
        {currentLocalePosts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No posts yet. Create your first post!</p>
            </CardContent>
          </Card>
        ) : (
          currentLocalePosts.map((post) => {
            return (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{post.title}</h3>
                        <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                          {post.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{post.summary}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Slug: {post.slug}</span>
                        <span>Updated: {new Date(post.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(post)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(post)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>Write your post content using the rich text editor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                placeholder="Enter post title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (optional)</Label>
              <Input 
                id="slug" 
                placeholder="auto-generated if left blank" 
                value={slug} 
                onChange={(e) => setSlug(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea 
                id="summary" 
                placeholder="Brief summary for preview cards" 
                value={summary} 
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <div className="rounded-lg border border-border/60 bg-background/60 overflow-hidden">
                <EditorToolbar editor={editor} />
                <div className="p-4">
                  <EditorContent editor={editor} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Use the toolbar above for formatting (bold, italic, headings, links, lists, etc.)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: "DRAFT" | "PUBLISHED") => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {actionStatus === "success" && (
              <Alert variant="default">
                <AlertDescription>Post saved successfully!</AlertDescription>
              </Alert>
            )}
            {actionStatus === "error" && (
              <Alert variant="destructive">
                <AlertDescription>Failed to save post. Please try again.</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={actionStatus === "saving"}>
              {actionStatus === "saving" ? "Saving..." : "Create Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>Update your post content</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input 
                id="edit-title" 
                placeholder="Enter post title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input 
                id="edit-slug" 
                value={slug} 
                disabled
              />
              <p className="text-xs text-muted-foreground">Slug cannot be changed after creation</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-summary">Summary</Label>
              <Textarea 
                id="edit-summary" 
                placeholder="Brief summary" 
                value={summary} 
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <div className="rounded-lg border border-border/60 bg-background/60 overflow-hidden">
                <EditorToolbar editor={editor} />
                <div className="p-4">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: "DRAFT" | "PUBLISHED") => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {actionStatus === "success" && (
              <Alert variant="default">
                <AlertDescription>Post updated successfully!</AlertDescription>
              </Alert>
            )}
            {actionStatus === "error" && (
              <Alert variant="destructive">
                <AlertDescription>Failed to update post. Please try again.</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={actionStatus === "saving"}>
              {actionStatus === "saving" ? "Saving..." : "Update Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <p className="text-sm text-muted-foreground">
              Post: {selectedPost.title || selectedPost.slug}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionStatus === "saving"}>
              {actionStatus === "saving" ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
