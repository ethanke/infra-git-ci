const { PrismaClient, PostStatus } = require("@prisma/client")

if (process.env.ALLOW_DEMO_SEED !== "true") {
  console.error("Demo seed aborted: ALLOW_DEMO_SEED must be set to \"true\" to avoid wiping production data.")
  process.exit(1)
}

const prisma = new PrismaClient()

const locales = ["en", "fr", "es", "zh", "hi", "ar", "bn", "pt"]

const categoryData = [
  {
    slug: "product-updates",
    name: "Product Updates",
    translations: {
      en: "Product Updates",
      fr: "Mises à jour produit",
      es: "Actualizaciones de producto",
      zh: "产品更新",
      hi: "उत्पाद अपडेट्स",
      ar: "تحديثات المنتج",
      bn: "প্রোডাক্ট আপডেট",
      pt: "Atualizações de produto"
    }
  },
  {
    slug: "ai-research",
    name: "AI Research",
    translations: {
      en: "AI Research",
      fr: "Recherche en IA",
      es: "Investigación en IA",
      zh: "人工智能研究",
      hi: "एआई अनुसंधान",
      ar: "أبحاث الذكاء الاصطناعي",
      bn: "এআই গবেষণা",
      pt: "Pesquisa em IA"
    }
  }
]

const tagData = [
  {
    slug: "launch",
    name: "Launch",
    translations: {
      en: "Launch",
      fr: "Lancement",
      es: "Lanzamiento",
      zh: "发布",
      hi: "लॉन्च",
      ar: "إطلاق",
      bn: "লঞ্চ",
      pt: "Lançamento"
    }
  },
  {
    slug: "workflow",
    name: "Workflow",
    translations: {
      en: "Workflow",
      fr: "Flux de travail",
      es: "Flujo de trabajo",
      zh: "工作流",
      hi: "वर्कफ़्लो",
      ar: "سير العمل",
      bn: "ওয়ার্কফ্লো",
      pt: "Fluxo de trabalho"
    }
  },
  {
    slug: "insights",
    name: "Insights",
    translations: {
      en: "Insights",
      fr: "Perspectives",
      es: "Ideas",
      zh: "洞察",
      hi: "अंतर्दृष्टि",
      ar: "رؤى",
      bn: "ইনসাইটস",
      pt: "Insights"
    }
  }
]

const postData = [
  {
    slug: "instant-multilingual-drafts",
    categories: ["product-updates"],
    tags: ["launch", "workflow"],
    translations: {
      en: {
        title: "Instant multilingual drafts for the lum.tools blog",
        summary: "Generate production-ready articles in any supported language with one click.",
        content: `<p>Our editorial teams can now go from idea to first draft in under five minutes. The new instant draft assistant synthesises research notes, suggests structure, and renders localized copy in all eight supported languages.</p>
<p>Editors retain full control: every generated section is auditable, annotated with source links and tone guidance. When you are happy with the result, publish directly or hand-off to reviewers.</p>
<ul>
  <li>Built-in terminology management ensures consistency across locales.</li>
  <li>Automatic metadata suggestions keep SEO and social cards in sync.</li>
  <li>Live preview mirrors the production layout, including dark mode accents.</li>
</ul>
<p>This release is available today for everyone with admin access. Try it from the “Create draft” button.</p>`,
        seoTitle: "Instant multilingual drafts | lum.tools blog",
        seoDescription: "Generate production-ready articles across eight languages with a single click."
      },
      fr: {
        title: "Des brouillons multilingues instantanés pour le blog lum.tools",
        summary: "Générez des articles prêts pour la production, dans toutes les langues supportées, en un clic.",
        content: `<p>Nos équipes éditoriales peuvent désormais passer de l’idée au premier jet en moins de cinq minutes. L’assistant de brouillon synthétise les notes, suggère une structure et fournit un texte localisé dans nos huit langues.</p>
<p>Les éditeurs gardent le contrôle total : chaque section générée contient les sources et des conseils de ton. Publiez immédiatement ou envoyez en relecture.</p>
<ul>
  <li>Le glossaire intégré garantit une terminologie cohérente.</li>
  <li>Les métadonnées SEO et sociales sont générées automatiquement.</li>
  <li>La prévisualisation reflète fidèlement le rendu final, y compris le mode sombre.</li>
</ul>
<p>La fonctionnalité est disponible dès aujourd’hui pour tous les administrateurs.</p>`,
        seoTitle: "Brouillons multilingues instantanés | lum.tools",
        seoDescription: "Passez de l’idée au premier jet en un clic, dans huit langues."
      },
      es: {
        title: "Borradores multilingües instantáneos para el blog de lum.tools",
        summary: "Genera artículos listos para producción en cualquiera de los idiomas soportados con un solo clic.",
        content: `<p>Los equipos editoriales ahora pueden pasar de la idea al primer borrador en menos de cinco minutos. El nuevo asistente genera una estructura propuesta, referencias y el contenido adaptado a cada idioma.</p>
<p>El editor conserva el control completo: cada bloque llega con notas, fuentes y sugerencias de tono. Cuando estés conforme, publícalo o envíalo al flujo de revisión.</p>
<ul>
  <li>Glosarios integrados para asegurar consistencia terminológica.</li>
  <li>SEO y tarjetas sociales se generan automáticamente.</li>
  <li>La vista previa refleja el diseño final, incluso en modo oscuro.</li>
</ul>
<p>Ya disponible para los administradores del blog.</p>`,
        seoTitle: "Borradores multilingües instantáneos | lum.tools",
        seoDescription: "Crea borradores en ocho idiomas diferentes con un clic."
      },
      zh: {
        title: "lum.tools 博客推出即时多语言草稿",
        summary: "只需一次点击，即可生成八种语言的发布级文章。",
        content: `<p>我们的编辑团队现在可以在五分钟内完成从灵感到初稿的全过程。全新的草稿助手会整理调研笔记、建议行文结构，并输出多语言版本。</p>
<p>编辑可以逐段审阅，每个段落都附带参考来源与语气提示。满意后即可直接发布或交给审稿人。</p>
<ul>
  <li>内置术语表确保各语言表述一致。</li>
  <li>自动生成 SEO 元数据与社交卡片。</li>
  <li>实时预览完全还原正式页面的排版与暗色模式。</li>
</ul>
<p>该能力今日起向所有管理员开放，欢迎体验。</p>`,
        seoTitle: "即时多语言草稿 | lum.tools",
        seoDescription: "一次点击生成多语言高质量文章草稿。"
      }
    }
  },
  {
    slug: "research-companion-workbench",
    categories: ["ai-research"],
    tags: ["insights", "workflow"],
    translations: {
      en: {
        title: "Inside the lum.tools Research Companion workbench",
        summary: "How we blend retrieval, synthesis and human context to accelerate insight work.",
        content: `<p>The Research Companion is more than a chat wrapper. It orchestrates retrieval pipelines, structured note-taking, and narrative generation in a single canvas.</p>
<p>Analysts can pin live data panels next to their hypothesis tracker, surface contradictions automatically, and export storyboards that feed directly into the publishing workflow.</p>
<h3>Why it matters</h3>
<ol>
  <li><strong>Less context switching:</strong> research artifacts, conversations and drafts live together.</li>
  <li><strong>Explainable synthesis:</strong> every paragraph references the evidence that shaped it.</li>
  <li><strong>Seamless hand-off:</strong> editors receive structured packets ready for refinement.</li>
</ol>
<p>We are rolling the workbench out to the product discovery and marketing intelligence squads this month.</p>`,
        seoTitle: "Research Companion workbench | lum.tools",
        seoDescription: "A guided environment that pairs retrieval and narrative building for faster insight teams."
      },
      fr: {
        title: "Dans les coulisses du workbench Research Companion",
        summary: "Retrieval, synthèse et contexte humain réunis pour accélérer les analyses.",
        content: `<p>Research Companion n’est pas un simple chatbot. Il orchestre la recherche documentaire, la prise de notes structurée et la narration dans un même espace.</p>
<p>Les analystes fixent leurs panneaux de données, suivent les hypothèses et exportent des storyboards directement exploitables par l’équipe éditoriale.</p>
<h3>Ce que cela change</h3>
<ol>
  <li><strong>Moins de déperdition :</strong> toutes les informations cruciales restent regroupées.</li>
  <li><strong>Traçabilité totale :</strong> chaque paragraphe renvoie aux preuves mobilisées.</li>
  <li><strong>Passation fluide :</strong> les éditeurs reçoivent un dossier immédiatement exploitable.</li>
</ol>
<p>Le déploiement commence ce mois-ci pour les équipes discovery et marketing.</p>`,
        seoTitle: "Workbench Research Companion | lum.tools",
        seoDescription: "Un environnement guidé pour créer des insights explicables plus rapidement."
      },
      es: {
        title: "Así funciona el Research Companion workbench",
        summary: "Unimos recuperación, síntesis y criterio humano para acelerar los insights.",
        content: `<p>Research Companion orquesta las fuentes de datos, la toma de notas y la narrativa en un único lienzo.</p>
<p>Los analistas pueden fijar paneles en vivo junto a su tracker de hipótesis, detectar contradicciones automáticamente y exportar storyboards listos para editorial.</p>
<p>Comenzamos el despliegue con los equipos de discovery de producto y marketing intelligence.</p>`,
        seoTitle: "Research Companion workbench | lum.tools",
        seoDescription: "Un espacio guiado para crear insights trazables mucho más rápido."
      },
      zh: {
        title: "揭秘 lum.tools Research Companion 工作台",
        summary: "将检索、综合与人工判断融合，加速洞察产出。",
        content: `<p>Research Companion 工作台把资料检索、结构化笔记与叙事生成整合在一个画布里。</p>
<p>分析师可以把实时数据面板与假设追踪器并排放置，自动标记矛盾点，并导出直接进入内容生产流程的故事板。</p>
<p>本月起会在产品探索与市场洞察小组上线。</p>`,
        seoTitle: "Research Companion 工作台 | lum.tools",
        seoDescription: "一个让洞察团队更快产出的引导式环境。"
      }
    }
  }
]

function translateMap(translations) {
  return locales.map((locale) => ({
    locale,
    name: translations[locale] ?? translations.en
  }))
}

function buildPostTranslations(translations) {
  return locales.map((locale) => {
    const base = translations[locale] ?? translations.en
    return {
      locale,
      title: base.title,
      summary: base.summary,
      content: base.content,
      seoTitle: base.seoTitle,
      seoDescription: base.seoDescription
    }
  })
}

async function seed() {
  await prisma.postTag.deleteMany()
  await prisma.postCategory.deleteMany()
  await prisma.postTranslation.deleteMany()
  await prisma.post.deleteMany()
  await prisma.tagTranslation.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.categoryTranslation.deleteMany()
  await prisma.category.deleteMany()

  for (const category of categoryData) {
    await prisma.category.create({
      data: {
        slug: category.slug,
        name: category.name,
        translations: {
          create: translateMap(category.translations)
        }
      }
    })
  }

  for (const tag of tagData) {
    await prisma.tag.create({
      data: {
        slug: tag.slug,
        name: tag.name,
        translations: {
          create: translateMap(tag.translations)
        }
      }
    })
  }

  for (const post of postData) {
    await prisma.post.create({
      data: {
        slug: post.slug,
        status: PostStatus.PUBLISHED,
        translations: {
          create: buildPostTranslations(post.translations)
        },
        categories: {
          create: post.categories.map((slug) => ({
            category: { connect: { slug } }
          }))
        },
        tags: {
          create: post.tags.map((slug) => ({
            tag: { connect: { slug } }
          }))
        }
      }
    })
  }
}

seed()
  .then(async () => {
    const counts = await Promise.all([
      prisma.post.count(),
      prisma.category.count(),
      prisma.tag.count()
    ])
    console.log(`Seeded demo content → posts: ${counts[0]}, categories: ${counts[1]}, tags: ${counts[2]}`)
  })
  .catch((error) => {
    console.error('Seeding failed', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
