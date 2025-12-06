#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const { Agent, run } = require('@openai/agents')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') })

DATABASE_URL = process.env.DATABASE_URL
const prisma = new PrismaClient(
  {
    datasourceUrl: DATABASE_URL
  }
)

// Supported locales
const locales = ['en', 'fr', 'es', 'zh', 'hi', 'ar', 'bn', 'pt']

// Translation prompts for each language
const translationPrompts = {
  fr: 'Translate to French',
  es: 'Translate to Spanish',
  zh: 'Translate to Simplified Chinese',
  hi: 'Translate to Hindi (Devanagari script)',
  ar: 'Translate to Arabic (right-to-left)',
  bn: 'Translate to Bengali',
  pt: 'Translate to Portuguese (Brazil)',
  en: 'Translate to English'
}

// Initialize OpenAI Agent for parsing
const parseAgent = new Agent({
  name: 'markdown-parser',
  instructions: 'Parse markdown content and extract structured data for blog posts. CRITICAL: Preserve ALL markdown formatting and include the FULL article content without truncation. Extract title, summary, content, SEO metadata, and suggest appropriate categories and tags.'
})

// Initialize OpenAI Agent for translation
const translateAgent = new Agent({
  name: 'ProfessionalTranslator',
  instructions: `You are a professional technical translator specializing in AI, software development, and technical documentation.

TRANSLATION RULES:
1. PRESERVE BRAND NAMES: Keep all brand names, company names, and product names in English (e.g., OpenAI, Anthropic, Claude, GitHub, JIRA, etc.)
2. PRESERVE TECHNICAL TERMS: Keep technical terms that are commonly used in English internationally (e.g., API, JSON-RPC, WebSocket, HTTP, etc.)
3. PRESERVE SCIENTIFIC PAPERS: Keep research paper titles, author names, and publication details in English
4. PRESERVE CODE: Keep all code examples, JSON, and technical syntax exactly as written
5. PRESERVE URLs: Keep all URLs and links unchanged
6. PRESERVE MARKDOWN: Maintain all markdown formatting, headers, lists, tables, code blocks, etc.
7. PRESERVE ACRONYMS: Keep technical acronyms in English (e.g., MCP, LLM, AI, API, etc.)

TRANSLATION GUIDELINES:
- Translate conceptual content, explanations, and narrative text
- Translate user-facing text like titles, summaries, and descriptions
- Maintain the professional, technical tone of the original
- Use appropriate technical terminology in the target language
- Ensure the translation reads naturally in the target language

For titles and metadata (title, summary, seoTitle, seoDescription), return ONLY the translated text without markdown formatting, quotes, or extra characters.`
})

// Parse markdown file using OpenAI Agent for metadata only
async function parseMarkdownWithAgent(content, locale) {
  // Get available categories and tags from database
  const categories = await prisma.category.findMany({
    select: { slug: true, name: true }
  })
  const tags = await prisma.tag.findMany({
    select: { slug: true, name: true }
  })

  const availableCategories = categories.map(c => `${c.slug} (${c.name})`).join(', ')
  const availableTags = tags.map(t => `${t.slug} (${t.name})`).join(', ')

  const prompt = `
You are a content parser for a blog system. Analyze the following markdown content and extract ONLY metadata.

MARKDOWN CONTENT:
${content}

LOCALE: ${locale}

AVAILABLE CATEGORIES (use EXACTLY one of these slugs):
${availableCategories}

AVAILABLE TAGS (use EXACTLY these slugs, select 3-8 most relevant):
${availableTags}

Please extract and return a JSON object with the following structure:
{
  "title": "Main title of the post (extract from H1 or frontmatter)",
  "summary": "Brief summary/excerpt (first paragraph or frontmatter, max 200 chars)",
  "seoTitle": "SEO optimized title (if different from main title)",
  "seoDescription": "SEO meta description (if available)",
  "suggestedCategory": "MUST be one of the available category slugs listed above",
  "suggestedTags": ["array", "of", "3-8", "available", "tag", "slugs", "from", "list", "above"]
}

RULES:
1. If frontmatter exists (between --- markers), extract metadata from it
2. Generate a meaningful summary from the first paragraph if not in frontmatter
3. CRITICAL: suggestedCategory MUST be exactly one of the available category slugs
4. CRITICAL: suggestedTags MUST only include slugs from the available tags list
5. DO NOT include the content field - we will preserve the original content exactly
6. Return ONLY valid JSON, no additional text or markdown formatting

Return the JSON object:`

  try {
    const result = await run(parseAgent, prompt)

    // Extract JSON from response
    const jsonMatch = result.finalOutput.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in agent response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    // Process content separately to preserve it exactly
    const processedContent = processContent(content)
    
    return {
      locale,
      title: parsed.title || 'Untitled',
      summary: parsed.summary || '',
      content: processedContent,
      seoTitle: parsed.seoTitle || parsed.title || 'Untitled',
      seoDescription: parsed.seoDescription || parsed.summary || '',
      suggestedCategory: parsed.suggestedCategory || 'product-updates',
      suggestedTags: parsed.suggestedTags || ['launch']
    }
  } catch (error) {
    console.error('Error parsing with OpenAI Agent:', error)
    console.log('Falling back to basic parsing...')
    
    // Fallback to basic parsing if agent fails
    return parseMarkdownBasic(content, locale)
  }
}

// Process content to remove frontmatter and title while preserving everything else
function processContent(content) {
  // Extract frontmatter (YAML or JSON)
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)
  
  let body = content
  
  if (match) {
    body = match[2] // Content after frontmatter
  }
  
  // Remove the main H1 title if it exists
  const titleMatch = body.match(/^#\s+(.+)$/m)
  if (titleMatch) {
    body = body.replace(/^#\s+.+$/m, '').trim()
  }
  
  return body
}

// Basic fallback parsing function
function parseMarkdownBasic(content, locale) {
  // Extract frontmatter (YAML or JSON)
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)
  
  let metadata = {}
  let body = content
  
  if (match) {
    const frontmatter = match[1]
    body = match[2]
    
    // Parse YAML frontmatter
    try {
      const lines = frontmatter.split('\n')
      lines.forEach(line => {
        const colonIndex = line.indexOf(':')
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim()
          const value = line.substring(colonIndex + 1).trim()
          metadata[key] = value.replace(/^["']|["']$/g, '')
        }
      })
    } catch (e) {
      console.warn('Could not parse frontmatter, using default values')
    }
  }
  
  // Extract title from first H1 if not in frontmatter
  if (!metadata.title) {
    const titleMatch = body.match(/^#\s+(.+)$/m)
    if (titleMatch) {
      metadata.title = titleMatch[1]
      // Remove title from body
      body = body.replace(/^#\s+.+$/m, '').trim()
    }
  }
  
  // Extract summary (first paragraph or frontmatter)
  if (!metadata.summary && body) {
    const firstParagraph = body.match(/^([^\n]+)/)
    if (firstParagraph) {
      metadata.summary = firstParagraph[1].substring(0, 200)
    }
  }
  
  return {
    locale,
    title: metadata.title || 'Untitled',
    summary: metadata.summary || '',
    content: body || content,
    seoTitle: metadata.seoTitle || metadata.title || 'Untitled',
    seoDescription: metadata.seoDescription || metadata.summary || '',
    suggestedCategory: metadata.category || 'product-updates',
    suggestedTags: metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : ['launch']
  }
}

function extractTranslatedText(result) {
  // Extract the final text output from the agent result
  if (result.finalOutput) {
    return result.finalOutput
  }
  
  // Try to get text from tool calls
  if (result.textOutput && result.textOutput.length > 0) {
    return result.textOutput[0]
  }
  
  // Fallback to raw output
  return String(result).trim()
}

// COMMANDS

async function importPost(args) {
  const mdFile = args[0]
  const language = args[1]
  const slug = args[2] || path.basename(mdFile, '.md').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const categorySlug = args[3]
  const tagSlugs = args[4] ? args[4].split(',') : null
  const dryRun = args.includes('--dry-run')
  
  if (!locales.includes(language)) {
    console.error(`Invalid language: ${language}. Must be one of:`, locales.join(', '))
    process.exit(1)
  }
  
  console.log(`📄 ${dryRun ? 'Testing' : 'Importing'} markdown post with AI parsing...`)
  console.log(`   File: ${mdFile}`)
  console.log(`   Language: ${language}`)
  console.log(`   Slug: ${slug}`)
  if (dryRun) {
    console.log(`   Mode: DRY RUN (no database operations)`)
  }
  
  // Read markdown file
  if (!fs.existsSync(mdFile)) {
    console.error(`❌ File not found: ${mdFile}`)
    process.exit(1)
  }
  
  const content = fs.readFileSync(mdFile, 'utf8')
  console.log(`🤖 Parsing content with OpenAI Agent...`)
  const parsedData = await parseMarkdownWithAgent(content, language)
  
  // Use AI suggestions if not provided via command line
  const finalCategorySlug = categorySlug || parsedData.suggestedCategory
  const finalTagSlugs = tagSlugs || parsedData.suggestedTags
  
  console.log(`   AI Suggested Category: ${parsedData.suggestedCategory}`)
  console.log(`   AI Suggested Tags: ${parsedData.suggestedTags.join(', ')}`)
  console.log(`   Final Category: ${finalCategorySlug}`)
  console.log(`   Final Tags: ${finalTagSlugs.join(', ')}`)
  
  if (dryRun) {
    console.log('\n📋 Parsed Data Summary:')
    console.log(`   Title: ${parsedData.title}`)
    console.log(`   Summary: ${parsedData.summary.substring(0, 100)}...`)
    console.log(`   Content Length: ${parsedData.content.length} characters`)
    console.log(`   SEO Title: ${parsedData.seoTitle}`)
    console.log(`   SEO Description: ${parsedData.seoDescription}`)
    console.log('\n🎉 Dry run complete! AI parsing successful.')
    return
  }
  
  // Get category
  const category = await prisma.category.findUnique({
    where: { slug: finalCategorySlug }
  })
  
  if (!category) {
    console.error(`❌ Category not found: ${finalCategorySlug}`)
    console.log('Available categories:')
    const categories = await prisma.category.findMany()
    categories.forEach(c => console.log(`  - ${c.slug}`))
    process.exit(1)
  }
  
  // Check if post already exists (using slug + locale combination)
  const existing = await prisma.post.findUnique({
    where: { 
      slug_locale: { 
        slug: slug, 
        locale: language 
      } 
    }
  })
  
  if (existing) {
    console.log(`⚠️  Post with slug "${slug}" and locale "${language}" already exists. Updating...`)
    
    // Update existing post
    await prisma.post.update({
      where: { id: existing.id },
      data: {
        title: parsedData.title,
        summary: parsedData.summary,
        content: parsedData.content,
        seoTitle: parsedData.seoTitle,
        seoDescription: parsedData.seoDescription
      }
    })
    
    // Update category
    await prisma.postCategory.deleteMany({
      where: { postId: existing.id }
    })
    await prisma.postCategory.create({
      data: {
        postId: existing.id,
        categoryId: category.id
      }
    })
    
    // Update tags
    await prisma.postTag.deleteMany({
      where: { postId: existing.id }
    })
    for (const tagSlug of finalTagSlugs) {
      const tag = await prisma.tag.findUnique({
        where: { slug: tagSlug }
      })
      if (tag) {
        await prisma.postTag.create({
          data: {
            postId: existing.id,
            tagId: tag.id
          }
        })
      }
    }
    
    console.log(`✅ Updated post: ${slug}`)
  } else {
    // Create new post
    const post = await prisma.post.create({
      data: {
        slug,
        locale: language,
        status: 'PUBLISHED',
        title: parsedData.title,
        summary: parsedData.summary,
        content: parsedData.content,
        seoTitle: parsedData.seoTitle,
        seoDescription: parsedData.seoDescription,
        categories: {
          create: {
            categoryId: category.id
          }
        }
      }
    })
    
    // Add tags
    for (const tagSlug of finalTagSlugs) {
      const tag = await prisma.tag.findUnique({
        where: { slug: tagSlug }
      })
      if (tag) {
        await prisma.postTag.create({
          data: {
            postId: post.id,
            tagId: tag.id
          }
        })
      }
    }
    
    console.log(`✅ Created post: ${slug}`)
  }
  
  console.log('🎉 Import complete!')
}

async function translatePost(args) {
  const slug = args[0]
  const sourceLang = args[1]
  const targetLang = args[2]
  const apiKey = args[3] || process.env.OPENAI_API_KEY
  
  if (!locales.includes(sourceLang) || !locales.includes(targetLang)) {
    console.error(`Invalid language. Must be one of:`, locales.join(', '))
    process.exit(1)
  }
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not set. Provide it as 4th argument or set environment variable.')
    process.exit(1)
  }
  
  console.log(`🌍 Translating post...`)
  console.log(`   Slug: ${slug}`)
  console.log(`   From: ${sourceLang} → To: ${targetLang}`)
  console.log('')
  
  // Get source post with categories and tags
  const sourcePost = await prisma.post.findUnique({
    where: { 
      slug_locale: { 
        slug: slug, 
        locale: sourceLang 
      } 
    },
    include: {
      categories: {
        include: {
          category: true
        }
      },
      tags: {
        include: {
          tag: true
        }
      }
    }
  })
  
  if (!sourcePost) {
    console.error(`❌ Post not found: ${slug} in language ${sourceLang}`)
    process.exit(1)
  }
  
  // Check if target translation already exists
  const existing = await prisma.post.findFirst({
    where: { 
      slug: slug, 
      locale: targetLang 
    }
  })
  if (existing) {
    console.log(`⚠️  Translation for ${targetLang} already exists. Overwriting...`)
  }
  
  console.log('⏳ Translating all content...')
  
  // Translate all fields in parallel using the agent
  const languagePrompt = translationPrompts[targetLang] || 'Translate'
  
  console.log('⏳ Translating title...')
  const titleResult = await run(translateAgent, `Translate the following title to ${languagePrompt}. IMPORTANT: Preserve brand names, technical terms, and acronyms in English. Return ONLY the translated title without any markdown, quotes, or extra characters:\n\n${sourcePost.title}`)
  
  console.log('⏳ Translating summary...')
  const summaryResult = await run(translateAgent, `Translate the following summary to ${languagePrompt}. IMPORTANT: Preserve brand names, technical terms, and acronyms in English. Return ONLY the translated summary without any markdown, quotes, or extra characters:\n\n${sourcePost.summary || ''}`)
  
  console.log('⏳ Translating content...')
  const contentResult = await run(translateAgent, `Translate the following blog post content to ${languagePrompt}. CRITICAL INSTRUCTIONS:
- Preserve ALL brand names (OpenAI, Anthropic, GitHub, etc.) in English
- Preserve ALL technical terms and acronyms (MCP, LLM, API, JSON-RPC, etc.) in English  
- Preserve ALL research paper titles and author names in English
- Preserve ALL code examples, JSON, and URLs exactly as written
- Maintain ALL markdown formatting (headers, lists, tables, code blocks, links)
- Translate only conceptual content, explanations, and narrative text
- Ensure the translation reads naturally in ${languagePrompt}:\n\n${sourcePost.content}`)
  
  console.log('⏳ Translating SEO title...')
  const seoTitleResult = await run(translateAgent, `Translate the following SEO title to ${languagePrompt}. IMPORTANT: Preserve brand names, technical terms, and acronyms in English. Return ONLY the translated title without any markdown, quotes, or extra characters:\n\n${sourcePost.seoTitle || sourcePost.title}`)
  
  console.log('⏳ Translating SEO description...')
  const seoDescResult = await run(translateAgent, `Translate the following SEO description to ${languagePrompt}. IMPORTANT: Preserve brand names, technical terms, and acronyms in English. Return ONLY the translated description without any markdown, quotes, or extra characters:\n\n${sourcePost.seoDescription || sourcePost.summary || ''}`)
  
  const translatedTitle = extractTranslatedText(titleResult)
  const translatedSummary = extractTranslatedText(summaryResult)
  const translatedContent = extractTranslatedText(contentResult)
  const translatedSeoTitle = extractTranslatedText(seoTitleResult)
  const translatedSeoDescription = extractTranslatedText(seoDescResult)
  
  console.log('✅ Translation complete!')
  
  // Use upsert to handle both create and update cases
  // For now, use locale-specific slug to avoid unique constraint issues
  const translatedSlug = `${sourcePost.slug}-${targetLang}`
  
  // Prepare category and tag data
  const categoryIds = sourcePost.categories.map(pc => pc.categoryId)
  const tagIds = sourcePost.tags.map(pt => pt.tagId)
  
  console.log('📋 Copying metadata...')
  console.log(`   Categories: ${sourcePost.categories.map(pc => pc.category.name).join(', ')}`)
  console.log(`   Tags: ${sourcePost.tags.map(pt => pt.tag.name).join(', ')}`)
  
  await prisma.post.upsert({
    where: {
      // Use the compound unique constraint
      slug_locale: { slug: translatedSlug, locale: targetLang }
    },
    update: {
      title: translatedTitle,
      summary: translatedSummary,
      content: translatedContent,
      seoTitle: translatedSeoTitle,
      seoDescription: translatedSeoDescription,
      updatedAt: new Date(),
      // Update categories and tags
      categories: {
        deleteMany: {}, // Remove existing categories
        create: categoryIds.map(categoryId => ({ categoryId }))
      },
      tags: {
        deleteMany: {}, // Remove existing tags
        create: tagIds.map(tagId => ({ tagId }))
      }
    },
    create: {
      slug: translatedSlug,
      locale: targetLang,
      status: sourcePost.status,
      title: translatedTitle,
      summary: translatedSummary,
      content: translatedContent,
      seoTitle: translatedSeoTitle,
      seoDescription: translatedSeoDescription,
      // Create categories and tags
      categories: {
        create: categoryIds.map(categoryId => ({ categoryId }))
      },
      tags: {
        create: tagIds.map(tagId => ({ tagId }))
      }
    }
  })
  
  if (existing) {
    console.log(`✅ Updated existing ${targetLang} translation for "${sourcePost.title}"`)
  } else {
    console.log(`✅ Created new ${targetLang} translation for "${sourcePost.title}"`)
  }
  
  console.log('')
  console.log('✅ Translation saved!')
  console.log(`   Title: ${translatedTitle}`)
  console.log(`   URL: /${targetLang}/posts/${translatedSlug}`)
}

async function exportPosts(args) {
  const outputFile = args[0] || 'posts-export.json'
  
  try {
    // Get all posts with their categories and tags
    const posts = await prisma.post.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    console.log(`Found ${posts.length} articles to export:`)
    
    const exportData = posts.map(post => ({
      slug: post.slug,
      locale: post.locale,
      status: post.status,
      title: post.title,
      summary: post.summary,
      content: post.content,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      categories: post.categories.map(pc => pc.category.slug),
      tags: post.tags.map(pt => pt.tag.slug)
    }))

    // Write to JSON file
    const exportPath = path.join(__dirname, '..', outputFile)
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2))
    
    console.log(`✅ Exported ${posts.length} articles to ${exportPath}`)
    
    // Also show summary
    posts.forEach(post => {
      console.log(`- ${post.slug} (${post.locale}): ${post.title}`)
    })
    
  } catch (error) {
    console.error('❌ Export failed:', error)
  }
}

async function importPosts(args) {
  const inputFile = args[0] || 'posts-export.json'
  
  try {
    // Read the exported articles
    const exportPath = path.join(__dirname, '..', inputFile)
    if (!fs.existsSync(exportPath)) {
      console.error('❌ Export file not found:', exportPath)
      return
    }

    const articles = JSON.parse(fs.readFileSync(exportPath, 'utf8'))
    console.log(`Found ${articles.length} articles to import:`)
    
    for (const article of articles) {
      console.log(`\n📄 Importing: ${article.slug} (${article.locale})`)
      
      // Check if article already exists
      const existing = await prisma.post.findUnique({
        where: {
          slug_locale: {
            slug: article.slug,
            locale: article.locale
          }
        }
      })

      if (existing) {
        console.log(`⚠️  Article already exists, updating...`)
        await prisma.post.update({
          where: { id: existing.id },
          data: {
            title: article.title,
            summary: article.summary,
            content: article.content,
            seoTitle: article.seoTitle,
            seoDescription: article.seoDescription,
            status: article.status
          }
        })
      } else {
        console.log(`✅ Creating new article...`)
        await prisma.post.create({
          data: {
            slug: article.slug,
            locale: article.locale,
            status: article.status,
            title: article.title,
            summary: article.summary,
            content: article.content,
            seoTitle: article.seoTitle,
            seoDescription: article.seoDescription
          }
        })
      }

      console.log(`✅ Successfully imported: ${article.title}`)
    }
    
    console.log(`\n🎉 Import complete! ${articles.length} articles processed.`)
    
  } catch (error) {
    console.error('❌ Import failed:', error)
  }
}

// MAIN FUNCTION
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log(`
📝 Blog Post Manager

USAGE:
  node post-manager.js <command> [options]

COMMANDS:
  import <markdown-file> <language> [slug] [category-slug] [tag-slug1,tag-slug2,...] [--dry-run]
    Import a markdown post with AI-powered parsing
    
  translate <post-slug> <source-language> <target-language> [openai-api-key]
    Translate an existing post to another language
    
  export [output-file]
    Export all posts to JSON file
    
  import-posts [input-file]
    Import posts from JSON file

EXAMPLES:
  # Import a post
  node post-manager.js import posts/my-post.md en
  
  # Import with custom slug and category
  node post-manager.js import posts/my-post.md en my-custom-slug developer-tutorials workflow,productivity
  
  # Test import without database operations
  node post-manager.js import posts/my-post.md en --dry-run
  
  # Translate a post
  node post-manager.js translate my-post-slug en fr
  
  # Translate to all languages
  for lang in fr es zh hi ar bn pt; do
    node post-manager.js translate my-post-slug en $lang
  done
  
  # Export all posts
  node post-manager.js export
  
  # Import posts from file
  node post-manager.js import-posts posts-export.json

LANGUAGES: ${locales.join(', ')}
`)
    process.exit(1)
  }
  
  const command = args[0]
  const commandArgs = args.slice(1)
  
  try {
    switch (command) {
      case 'import':
        await importPost(commandArgs)
        break
      case 'translate':
        await translatePost(commandArgs)
        break
      case 'export':
        await exportPosts(commandArgs)
        break
      case 'import-posts':
        await importPosts(commandArgs)
        break
      default:
        console.error(`Unknown command: ${command}`)
        process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
