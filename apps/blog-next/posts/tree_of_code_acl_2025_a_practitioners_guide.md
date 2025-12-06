# Tree-of-Code (ToC) Explained: End-to-End Code Agents for Complex, Multi‑Tool Tasks

---

## TL;DR
**Tree‑of‑Code (ToC)** is a framework that treats each agent “turn” as a **complete, executable program** (a *CodeProgram*) instead of a single tool call or partial step. It grows a **tree of full solutions**, executes them, keeps the ones that **succeed**, and then **votes** to select the final answer. In controlled experiments, ToC shows **higher accuracy** with **far fewer interaction turns** than step‑by‑step methods like ReAct and CodeAct.

---

## Why this paper matters
Most LLM agents handle complex tasks by chaining many tiny steps (think: one tool call per turn). That’s flexible but often **slow, brittle, and hallucination‑prone** when the chain gets long. ToC reframes the unit of work: **write the whole program**, run it, and iterate **by growing branches** only when needed. That change:
- Cuts **turns** dramatically (fewer model calls & tokens)
- Uses **execution success** as the supervision signal (no ground‑truth per step)
- Encourages **diverse solution paths** via prompt/model variation

---

## The core ideas (in plain English)
### 1) CodeProgram: code‑as‑reasoning, end‑to‑end
Instead of emitting fragmented actions, the model produces a **complete program** that encodes its global reasoning and calls any available tools/APIs as needed. The program is executed; **success/failure** directly labels the attempt.

### 2) A self‑growing tree of solutions
Start from a root attempt. If the run fails, **reflect**, modify the approach, and branch into a few new **child programs**. Repeat for a small number of layers. Collect all **successfully executed** nodes and use a simple **majority vote** to pick the final answer.

### 3) Diversity through prompts & models
To avoid “tunnel vision,” ToC varies the **prompt templates** and even **the underlying model** across branches (akin to an ensemble). This boosts robustness without bespoke training.

---

## How ToC compares to ReAct and CodeAct
- **ReAct**: interleaves short thoughts and actions; flexible but many turns and growing context.  
- **CodeAct**: uses code blocks as actions but still **step‑by‑step**, which can fragment reasoning and depend on per‑step supervision.  
- **ToC**: **end‑to‑end program per turn** + **tree expansion** only when needed; supervision comes from **program execution success**.

**Practical effect:** Fewer turns on average, lower output verbosity, and higher correctness on multi‑tool evaluations.

---

## Experimental setup (high level)
- **Datasets**: two multi‑tool benchmarks were used: **M3ToolEval** (five scenarios including travel planning and web browsing) and **API‑Bank level‑3** (the hardest split).  
- **Models**: a pool of popular closed‑ and open‑weight LLMs (including GPT‑4‑series, Claude‑3.5 Sonnet, Qwen2.5‑72B, DeepSeek‑chat) feed the branches.  
- **Metrics**: **Accuracy** (tasks solved), **average turns**, and **output length** (proxy for cost).  
- **Key result**: ToC improves accuracy vs. baselines **while using far fewer turns** (≈ one to two per task in many cases).

---

## What the numbers say (digestible summary)
- On **M3ToolEval**, ToC substantially improves correctness over **ReAct** and **CodeAct**, while average turns drop from ~7–9 to **≈1–2**.  
- On **API‑Bank L3**, ToC roughly **doubles** accuracy vs ReAct and improves over CodeAct, again with **fewer turns**.  
- A small **breadth** (e.g., 3 child nodes per layer) and shallow **depth** (1–3 layers) capture most of the gains without heavy compute.

> Takeaway: Treating a turn as a **full executable** lets the model “think in code” and fail fast, instead of accumulating fragile micro‑steps.

---

## Important implementation details
- **Reflection & expansion.** After a failed run, ToC asks the model to **reflect on errors** (type mismatches, missing keys, tool misuse), then regenerate a full program with fixes.
- **Helper functions.** For web tasks, the paper introduces simple helpers (e.g., *next_action*, *res_handler*) to keep the program end‑to‑end without interactive pauses.
- **Voting.** When multiple successful programs exist, choose the most common answer (simple **majority vote**). Ties are rare in practice.
- **Prompt pool.** A seed prompt is **evolved** into several variants; mixing in different models and prompts increases diversity and performance.

---

## Limitations to keep in mind
- **Open‑ended environments** (e.g., unconstrained robotics) may still need fine‑grained exploration; a single end‑to‑end program might be too coarse.  
- **Very long programs** can exceed model context or runtime constraints.  
- **Tree growth** still consumes compute—cap breadth/depth and cache results.

---

## When should you use ToC (in practice)?
Use ToC when your task:
- Requires **multiple tool calls** and **non‑trivial control flow**
- Benefits from **parallel exploration** of alternative programs
- Allows you to **execute** the proposed program to get a clear success/failure signal

Stick with step‑by‑step (or mix approaches) when:
- You need fine interactive control or human‑in‑the‑loop at each step  
- The environment is **unknown** or **cannot be executed** deterministically

---

## Reproducing results: a quick roadmap
1. **Benchmarks**: start with **M3ToolEval** and **API‑Bank (level‑3)**; adapt API‑Bank tool signatures for code execution.  
2. **Prompts**: build a small **prompt pool** by evolving a strong root prompt; include a reflection template.  
3. **Models**: try 1–2 models first; add a second family (e.g., Claude + GPT) for diversity.  
4. **Tree policy**: cap at **3 children × 1–3 layers**; stop a branch as soon as a program **executes successfully**.  
5. **Voting**: aggregate successful outputs; keep **artifacts** (code, logs) for auditing.

---

## How this maps to lum.tools
- **lum‑browser** can provide deterministic browsing & capture inside a **CodeProgram**.  
- **lum‑deep‑search** can supply **multi‑source evidence**; ToC’s end‑to‑end program can orchestrate queries → fetches → synthesis with citations.  
- **CloudProxy / k3s HPA** help scale parallel branches safely.

---

## References (primary & datasets)
- **Tree‑of‑Code: A Self‑Growing Tree Framework for End‑to‑End Code Generation and Execution in Complex Tasks.** Findings of ACL 2025.  
- **M3ToolEval** benchmark (as used in the paper).  
- **API‑Bank** dataset (level‑3 split described in the paper).  
- **ReAct** (Yao et al., 2022) and **CodeAct** (Wang et al., 2024) for baselines.

> If you’d like, we can add code snippets and a minimal open‑source reproducer (Python) that mirrors the paper’s tree policy and voting mechanism.

