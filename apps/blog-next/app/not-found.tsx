'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageCircleWarning } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col gradient-bg">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl mx-auto p-8 text-center border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="space-y-6">
            {/* 404 Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <MessageCircleWarning className="w-12 h-12 text-primary" />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl"></div>
              </div>
            </div>

            {/* 404 Content */}
            <div className="space-y-4">
              <h1 className="text-6xl font-bold tracking-tight text-foreground">
                404
              </h1>
              <h2 className="text-2xl font-semibold text-foreground">
                Page Not Found
              </h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Quick Links</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link 
                  href="/en/posts" 
                  className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/50 p-3 hover:bg-card/80 hover:border-primary/60 transition-all"
                >
                  <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium">Browse Articles</div>
                    <div className="text-xs text-muted-foreground">Explore our latest posts</div>
                  </div>
                </Link>
                <Link 
                  href="/en/categories" 
                  className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/50 p-3 hover:bg-card/80 hover:border-primary/60 transition-all"
                >
                  <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium">Browse Categories</div>
                    <div className="text-xs text-muted-foreground">Find topics by category</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="btn-primary">
                <Link href="/en">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Go Home
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="btn-secondary">
                <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Go Back
                </Link>
              </Button>
            </div>

            {/* Search Suggestion */}
            <div className="pt-4 border-t border-border/20">
              <p className="text-sm text-muted-foreground">
                Looking for something specific?{" "}
                <Link 
                  href="/en/posts" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Browse all articles
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}