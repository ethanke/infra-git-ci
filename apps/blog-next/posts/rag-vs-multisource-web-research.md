
---

## TL;DR

* **RAG** retrieves passages from a *curated, indexed corpus* (e.g., your docs) and conditions the LLM on that evidence. It excels at **low-latency, controlled, compliance-friendly** QA where you own the knowledge base.
* **Multi-Source Web Research (MSWR)** sends the LLM (or an agent) to the **open web** to search, browse, and cite across *many* sources, then synthesize an answer. It shines when you need **freshness, coverage, and triangulation** beyond your internal corpus.
* In practice, **hybrid pipelines win**: use **RAG for internal, stable facts** and **MSWR** for **news, market intel, and conflicting claims**—with **explicit citations**.

---

## What we mean by RAG vs MSWR

### Retrieval‑Augmented Generation (RAG)

**Definition.** Augment an LLM with retrieved chunks from a pre-built index of your knowledge base (e.g., docs, wikis). RAG reduces hallucination by grounding the model in *your* corpus and keeps data governed within your perimeter.
**Canonical reference:** *Retrieval‑Augmented Generation for Knowledge‑Intensive NLP* (Lewis et al., 2020). See References.

### Multi‑Source Web Research (MSWR)

**Definition.** Let the model **search, browse, and cite** across external sites (news, papers, docs) in real time, often via **tool use/agents** (e.g., issuing queries, following links, collecting references). Early exemplars include **WebGPT** (OpenAI, 2021), **Self‑Ask with Search** (2022), and **ReAct** (2022). See References.

---

## Architecture at a glance

**RAG pipeline**

1. Ingest → chunk → embed → index (vector/keyword).
2. At query time: retrieve top‑k chunks → re-rank → compose prompt → generate.
3. Optional: cite internal doc URLs/anchors.

**MSWR pipeline**

1. Formulate sub‑questions → issue web searches.
2. Browse candidate pages; extract snippets + URLs.
3. Cross‑check claims; discard low‑quality/duplicate sources.
4. Synthesize with **attributed citations** to the final answer.

---

## When each approach wins

| Scenario                           | Choose RAG                                 | Choose MSWR                                            |
| ---------------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| **Internal policy / product docs** | ✅ Index your docs; deterministic grounding | ❌ Unnecessary web crawl                                |
| **Fresh news / fast‑moving tech**  | ⚠️ Index drift; frequent re‑ingests        | ✅ Search/browse today’s sources with citations         |
| **Market/competitor research**     | ⚠️ Partial coverage                        | ✅ Triangulate across many domains, viewpoints          |
| **Compliance & privacy**           | ✅ Data stays in‑house; access control      | ⚠️ Must filter sources; avoid tracking; respect robots |
| **Latency / cost per query**       | ✅ Low once index is built                  | ⚠️ Higher (search + browsing hops)                     |
| **Explainability for auditors**    | ✅ Cite internal pages                      | ✅ Cite external sources + snapshot links               |

> **Rule of thumb:** If the answer *should* live in your docs, use **RAG**. If the world changes under your feet, use **MSWR**—and cite.

---

## Failure modes & how to mitigate

**RAG**

* *Recall gaps* (missing/old content) → **Continuous ingestion**, freshness alerts, doc ownership.
* *Chunk mismatch* → **Semantics‑aware chunking** + re‑ranking.
* *Over‑anchoring on stale facts* → **Temporal metadata** + decay in retrieval.

**MSWR**

* *Source quality variance* → **Whitelist reputable TLDs**, penalize low‑trust sites, require **2+ independent sources**.
* *Citations drift/vanish* → **Snapshotting** (e.g., saving extracts + URLs).
* *Latency & rate limits* → **Parallel search**, **caching**, and **proxy rotation**.

---

## A simple hybrid pattern (recommended)

1. Try **RAG** first against your internal corpus.
2. If confidence is low or time filters indicate potential staleness, **fallback to MSWR** to supplement with fresh, external evidence.
3. **Merge & de‑duplicate** citations; mark each claim with **internal**(RAG) or **external**(web) provenance.

---

## Where lum‑deep‑search fits

`lum-deep-search` is designed for **MSWR**: it performs multi‑query expansion, fetches and cleans pages, de‑duplicates, then **synthesizes with citations**. It’s complementary to a RAG index of your private docs. Together they provide:

* **Coverage** (web) + **control** (internal KB)
* **Freshness** for market/news + **stability** for product facts
* **Transparent citations** for both internal and external claims

---

## Evaluation: apples‑to‑apples

* **Grounded accuracy**: human or rubric‑based checks against the provided citations.
* **Attribution quality**: are citations specific, accessible, and relevant?
* **Freshness**: time‑to‑index (RAG) vs time‑to‑source (MSWR).
* **Latency & cost**: median p95 end‑to‑end (include network hops).
* **Safety**: source filtering; PII/governance compliance logs.

---

## Implementation sketch

**RAG** (Python, pseudo):

```python
chunks = embed(docs)
index = build_vector_index(chunks)
def answer(q):
    hits = index.search(q, top_k=8)
    prompt = compose(hits, q)
    return llm(prompt)
```

**MSWR** (Python, pseudo):

```python
def deep_search(q):
    queries = expand(q)
    pages = parallel_fetch(queries)
    cleaned = extract_text(pages)
    evidence = dedupe_and_score(cleaned)
    return synthesize_with_citations(q, evidence)
```

---

## FAQ

**Is MSWR just RAG with the web as a corpus?**
Not exactly. RAG assumes a **pre‑indexed** static corpus you control. MSWR actively **navigates** the web, often with **reason‑act loops** (e.g., ReAct), and must handle **source quality and freshness** dynamically.

**Can I use both?**
Yes—most mature systems do. Start with RAG; **fallback to MSWR** when recency or coverage is required.

**What about tool‑use frameworks (ReAct, Toolformer)?**
They provide the **reason‑and‑act** scaffolding that powers MSWR—deciding *when* to search, *what* to open, and *how* to cite.

---

## References (peer‑reviewed & primary sources)

* **RAG (original)** — Lewis et al., 2020: *Retrieval‑Augmented Generation for Knowledge‑Intensive NLP*. arXiv. [https://arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401) (PDF: [https://arxiv.org/pdf/2005.11401](https://arxiv.org/pdf/2005.11401))
* **Web browsing QA** — Nakano et al., 2021: *WebGPT: Browser‑assisted question‑answering with human feedback*. arXiv/OpenAI. [https://arxiv.org/abs/2112.09332](https://arxiv.org/abs/2112.09332) (PDF: [https://cdn.openai.com/WebGPT.pdf](https://cdn.openai.com/WebGPT.pdf))
* **Self‑Ask with Search** — Press et al., 2022: *Measuring and Narrowing the Compositionality Gap in Language Models* (Self‑Ask). arXiv. [https://arxiv.org/abs/2210.03350](https://arxiv.org/abs/2210.03350) (PDF: [https://ofir.io/self-ask.pdf](https://ofir.io/self-ask.pdf))
* **ReAct** — Yao et al., 2022: *ReAct: Synergizing Reasoning and Acting in Language Models*. arXiv. [https://arxiv.org/abs/2210.03629](https://arxiv.org/abs/2210.03629) (PDF: [https://arxiv.org/pdf/2210.03629](https://arxiv.org/pdf/2210.03629))
* **Toolformer** — Schick et al., 2023: *Language Models Can Teach Themselves to Use Tools*. arXiv/OpenReview. [https://arxiv.org/abs/2302.04761](https://arxiv.org/abs/2302.04761) (OpenReview: [https://openreview.net/forum?id=Yacmpz84TH](https://openreview.net/forum?id=Yacmpz84TH))
* **Survey (2025)** — *Retrieval‑Augmented Generation: A Comprehensive Survey*. arXiv, 2025. [https://arxiv.org/abs/2506.00054](https://arxiv.org/abs/2506.00054)
* **Freshness** — Vu et al., 2023: *FreshLLMs / FreshPrompt: Refreshing LLMs with Search*. arXiv. [https://arxiv.org/abs/2310.03214](https://arxiv.org/abs/2310.03214)

---

> **Takeaway:** Use **RAG** when the truth lives in your repo. Use **MSWR** when the truth lives in the world.
