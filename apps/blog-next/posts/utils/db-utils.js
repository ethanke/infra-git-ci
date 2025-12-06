#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// COMMANDS

async function seedCategoriesAndTags() {
  console.log('🌱 Seeding categories and tags...')

  const categories = [
    {
      slug: 'product-updates',
      translations: {
        en: 'Product Updates',
        fr: 'Mises à jour produit',
        es: 'Actualizaciones de producto',
        zh: '产品更新',
        hi: 'उत्पाद अपडेट्स',
        ar: 'تحديثات المنتج',
        bn: 'প্রোডাক্ট আপডেট',
        pt: 'Atualizações de produto'
      }
    },
    {
      slug: 'developer-tutorials',
      translations: {
        en: 'Developer Tutorials',
        fr: 'Tutoriels pour développeurs',
        es: 'Tutoriales para desarrolladores',
        zh: '开发者教程',
        hi: 'डेवलपर ट्यूटोरियल',
        ar: 'دروس المطورين',
        bn: 'ডেভেলপার টিউটোরিয়াল',
        pt: 'Tutoriais para Desenvolvedores'
      }
    },
    {
      slug: 'ai-ml',
      translations: {
        en: 'AI & Machine Learning',
        fr: 'IA & Apprentissage automatique',
        es: 'IA y Aprendizaje Automático',
        zh: '人工智能与机器学习',
        hi: 'एआई और मशीन लर्निंग',
        ar: 'الذكاء الاصطناعي والتعلم الآلي',
        bn: 'এআই এবং মেশিন লার্নিং',
        pt: 'IA e Aprendizado de Máquina'
      }
    },
    {
      slug: 'infrastructure-devops',
      translations: {
        en: 'Infrastructure & DevOps',
        fr: 'Infrastructure et DevOps',
        es: 'Infraestructura y DevOps',
        zh: '基础设施与开发运维',
        hi: 'अवसंरचना और DevOps',
        ar: 'البنية التحتية و DevOps',
        bn: 'ইnfrastructure এবং DevOps',
        pt: 'Infraestrutura e DevOps'
      }
    },
    {
      slug: 'open-source',
      translations: {
        en: 'Open Source',
        fr: 'Logiciel libre',
        es: 'Código abierto',
        zh: '开源',
        hi: 'ओपन सोर्स',
        ar: 'مفتوح المصدر',
        bn: 'ওপেন সোর্স',
        pt: 'Código Aberto'
      }
    },
    {
      slug: 'performance-optimization',
      translations: {
        en: 'Performance & Optimization',
        fr: 'Performance et optimisation',
        es: 'Rendimiento y optimización',
        zh: '性能与优化',
        hi: 'प्रदर्शन और अनुकूलन',
        ar: 'الأداء والتحسين',
        bn: 'পারফরম্যান্স এবং অপ্টিমাইজেশন',
        pt: 'Desempenho e Otimização'
      }
    }
  ]

  const tags = [
    { slug: 'lum-browser', name: 'lum-browser' },
    { slug: 'lum-deep-search', name: 'lum-deep-search' },
    { slug: 'lrok', name: 'lrok' },
    { slug: 'mcp-tools', name: 'MCP Tools', translations: {
      en: 'MCP Tools', fr: 'Outils MCP', es: 'Herramientas MCP',
      zh: 'MCP 工具', hi: 'MCP टूल', ar: 'أدوات MCP', bn: 'MCP টুলস', pt: 'Ferramentas MCP'
    }},
    { slug: 'platform', name: 'Platform', translations: {
      en: 'Platform', fr: 'Plateforme', es: 'Plataforma',
      zh: '平台', hi: 'प्लेटफॉर्म', ar: 'المنصة', bn: 'প্ল্যাটফর্ম', pt: 'Plataforma'
    }},
    { slug: 'api', name: 'API' },
    { slug: 'authentication', name: 'Authentication', translations: {
      en: 'Authentication', fr: 'Authentification', es: 'Autenticación',
      zh: '身份验证', hi: 'प्रमाणीकरण', ar: 'المصادقة', bn: 'নথিভুক্তকরণ', pt: 'Autenticação'
    }},
    { slug: 'caching', name: 'Caching', translations: {
      en: 'Caching', fr: 'Mise en cache', es: 'Almacenamiento en caché',
      zh: '缓存', hi: 'कैशिंग', ar: 'التخزين المؤقت', bn: 'ক্যাশিং', pt: 'Cache'
    }},
    { slug: 'deployment', name: 'Deployment', translations: {
      en: 'Deployment', fr: 'Déploiement', es: 'Despliegue',
      zh: '部署', hi: 'तैनाती', ar: 'النشر', bn: 'মোতায়েন', pt: 'Implantação'
    }},
    { slug: 'python', name: 'Python' },
    { slug: 'typescript', name: 'TypeScript' },
    { slug: 'nextjs', name: 'Next.js' },
    { slug: 'llm', name: 'LLM' },
    { slug: 'gpt', name: 'GPT' },
    { slug: 'productivity', name: 'Productivity', translations: {
      en: 'Productivity', fr: 'Productivité', es: 'Productividad',
      zh: '生产力', hi: 'उत्पादकता', ar: 'الإنتاجية', bn: 'উৎপাদনশীলতা', pt: 'Produtividade'
    }},
    { slug: 'workflow', name: 'Workflow', translations: {
      en: 'Workflow', fr: 'Flux de travail', es: 'Flujo de trabajo',
      zh: '工作流程', hi: 'कार्यप्रवाह', ar: 'سير العمل', bn: 'ওয়ার্কফ্লো', pt: 'Fluxo de Trabalho'
    }}
  ]

  // Seed Categories
  for (const cat of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: cat.slug }
    })

    if (existing) {
      // Update translations
      for (const [locale, name] of Object.entries(cat.translations)) {
        await prisma.categoryTranslation.upsert({
          where: {
            categoryId_locale: { categoryId: existing.id, locale }
          },
          update: { name },
          create: {
            categoryId: existing.id,
            locale,
            name
          }
        })
      }
      console.log(`✓ Updated category: ${cat.slug}`)
    } else {
      // Create new category
      await prisma.category.create({
        data: {
          slug: cat.slug,
          name: cat.translations.en,
          translations: {
            create: Object.entries(cat.translations).map(([locale, name]) => ({
              locale,
              name
            }))
          }
        }
      })
      console.log(`✓ Created category: ${cat.slug}`)
    }
  }

  // Seed Tags
  for (const tag of tags) {
    const existing = await prisma.tag.findUnique({
      where: { slug: tag.slug }
    })

    if (existing) {
      // Update translations if they exist
      if (tag.translations) {
        for (const [locale, name] of Object.entries(tag.translations)) {
          await prisma.tagTranslation.upsert({
            where: {
              tagId_locale: { tagId: existing.id, locale }
            },
            update: { name },
            create: {
              tagId: existing.id,
              locale,
              name
            }
          })
        }
      }
      console.log(`✓ Updated tag: ${tag.slug}`)
    } else {
      // Create new tag
      await prisma.tag.create({
        data: {
          slug: tag.slug,
          name: tag.name,
          translations: tag.translations ? {
            create: Object.entries(tag.translations).map(([locale, name]) => ({
              locale,
              name
            }))
          } : undefined
        }
      })
      console.log(`✓ Created tag: ${tag.slug}`)
    }
  }

  console.log('✅ Seeding complete!')
}

async function checkSchema() {
  console.log('🔍 Checking Post table schema...\n')
  
  // Check columns
  const columns = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'Post' 
    ORDER BY ordinal_position
  `
  
  console.log('✅ Post table columns:')
  console.log(columns)
  
  // Expected columns
  const expectedColumns = [
    'id', 'slug', 'locale', 'status', 'createdAt', 'updatedAt', 
    'title', 'summary', 'content', 'seoTitle', 'seoDescription'
  ]
  
  const actualColumns = columns.map(c => c.column_name)
  const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col))
  const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col))
  
  if (missingColumns.length > 0) {
    console.error('\n❌ Missing columns:', missingColumns)
    process.exit(1)
  }
  
  if (extraColumns.length > 0) {
    console.log('\n⚠️  Extra columns:', extraColumns)
  }
  
  // Check constraints
  const constraints = await prisma.$queryRaw`
    SELECT constraint_name, constraint_type
    FROM information_schema.table_constraints 
    WHERE table_name = 'Post'
  `
  
  console.log('\n✅ Table constraints:')
  console.log(constraints)
  
  // Check unique constraint on (slug, locale)
  const hasSlugLocaleConstraint = constraints.some(
    c => c.constraint_name === 'Post_slug_locale_key' || 
         c.constraint_name?.includes('slug_locale') ||
         (c.constraint_type === 'UNIQUE' && c.constraint_name)
  )
  
  if (!hasSlugLocaleConstraint) {
    console.error('\n❌ Missing unique constraint on (slug, locale)')
    process.exit(1)
  }
  
  // Check if PostTranslation table exists (it shouldn't)
  const postTranslationExists = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'PostTranslation'
    )
  `
  
  if (postTranslationExists[0].exists) {
    console.error('\n❌ PostTranslation table still exists (should be removed)')
    process.exit(1)
  } else {
    console.log('\n✅ PostTranslation table correctly removed')
  }
  
  // Sample data check
  const postCount = await prisma.post.count()
  console.log(`\n📊 Total posts: ${postCount}`)
  
  if (postCount > 0) {
    const samplePost = await prisma.post.findFirst({
      select: {
        id: true,
        slug: true,
        locale: true,
        title: true,
        status: true
      }
    })
    
    console.log('\n📄 Sample post:')
    console.log(samplePost)
    
    if (!samplePost.locale || !samplePost.title) {
      console.error('\n❌ Sample post missing locale or title (migration may have failed)')
      process.exit(1)
    }
  }
  
  console.log('\n✅ Schema validation passed!')
}

async function runMigration(args) {
  const sqlFile = args[0]
  
  if (!sqlFile) {
    console.error('Usage: node db-utils.js migrate <sql-file>')
    process.exit(1)
  }
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ SQL file not found: ${sqlFile}`)
    process.exit(1)
  }
  
  const sql = fs.readFileSync(sqlFile, 'utf8')
  const queries = sql.split(';').filter(q => q.trim()).map(q => q.trim() + ';')
  
  console.log(`📄 Running migration from ${sqlFile}...`)
  console.log(`Found ${queries.length} queries to execute`)
  
  for (const query of queries) {
    if (query.includes('DROP CONSTRAINT IF EXISTS')) {
      // Skip constraint drops that might fail
      try {
        await prisma.$executeRawUnsafe(query)
        console.log('✓ Executed constraint drop')
      } catch (e) {
        console.log('⊘ Skipped (constraint might not exist):', e.message)
      }
    } else {
      try {
        await prisma.$executeRawUnsafe(query)
        console.log('✓ Executed query')
      } catch (e) {
        console.log('✗ Error:', e.message)
        if (e.message.includes('already exists') || e.message.includes('does not exist, skipping')) {
          // These are acceptable
        } else {
          throw e
        }
      }
    }
  }
  
  console.log('✅ Migration complete!')
}

async function checkColumns() {
  const columns = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Post' 
    ORDER BY ordinal_position
  `
  
  console.log('Post table columns:')
  console.log(JSON.stringify(columns, null, 2))
}

// MAIN FUNCTION
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log(`
🗄️  Database Utilities

USAGE:
  node db-utils.js <command> [options]

COMMANDS:
  seed
    Seed categories and tags with translations
    
  check-schema
    Validate database schema and constraints
    
  migrate <sql-file>
    Run SQL migration file
    
  check-columns
    List all columns in Post table

EXAMPLES:
  # Seed categories and tags
  node db-utils.js seed
  
  # Check database schema
  node db-utils.js check-schema
  
  # Run migration
  node db-utils.js migrate migration.sql
  
  # Check table columns
  node db-utils.js check-columns
`)
    process.exit(1)
  }
  
  const command = args[0]
  const commandArgs = args.slice(1)
  
  try {
    switch (command) {
      case 'seed':
        await seedCategoriesAndTags()
        break
      case 'check-schema':
        await checkSchema()
        break
      case 'migrate':
        await runMigration(commandArgs)
        break
      case 'check-columns':
        await checkColumns()
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
