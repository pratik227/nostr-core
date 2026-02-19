---
outline: false
---

# Agent & AI Documentation

Use these resources to feed nostr-core documentation into your AI agent, LLM, or coding assistant.

## Agent Integration

Ready-made files for AI agents to discover, understand, and integrate with nostr-core:

| File | Description |
|------|-------------|
| [`/llms.txt`](/llms.txt) | Discovery index — structured overview of all docs, following the [llms.txt standard](https://llmstxt.org/) |
| [`AGENT_README.md`](https://github.com/pratik227/nostr-core/blob/main/AGENT_README.md) | Full integration guide — every method with request/response examples, error handling, agent tips |
| [`integration-prompt.md`](https://github.com/pratik227/nostr-core/blob/main/docs/llm/integration-prompt.md) | Copy-paste system prompt and code templates for wiring agents to nostr-core |

## Quick Copy

Copy the full documentation as a single markdown file to paste into your LLM context:

<a href="/llms-full.txt" target="_blank" style="display:inline-block;padding:10px 20px;background:var(--vp-c-brand-1);color:var(--vp-c-white);border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0;">Open llms-full.txt</a>

## Machine-Readable Index

The `llms.txt` file provides a structured index of all documentation pages:

<a href="/llms.txt" target="_blank" style="display:inline-block;padding:10px 20px;background:var(--vp-c-brand-1);color:var(--vp-c-white);border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0;">Open llms.txt</a>

## What's Included

| File | Size | Description |
|------|------|-------------|
| [`/llms.txt`](/llms.txt) | ~1 KB | Structured index with page descriptions — point your agent here first |
| [`/llms-full.txt`](/llms-full.txt) | ~25 KB | Complete documentation in a single file — all guides + full API reference |
| [`AGENT_README.md`](https://github.com/pratik227/nostr-core/blob/main/AGENT_README.md) | ~8 KB | Agent integration guide with examples and error tables |
| [`integration-prompt.md`](https://github.com/pratik227/nostr-core/blob/main/docs/llm/integration-prompt.md) | ~6 KB | System prompt, code templates, MCP config, validation checklist |

## Usage with AI Tools

### Claude / ChatGPT / Cursor / Copilot

1. Open [`/llms-full.txt`](/llms-full.txt)
2. Select all and copy (`Ctrl+A`, `Ctrl+C`)
3. Paste into your AI chat or attach as context

### Agents & Automated Tools

Point your agent to fetch:

```
https://your-docs-site.com/llms.txt
```

The `llms.txt` file links to all documentation pages so agents can fetch only what they need.

### Claude Code / Aider / Other CLI Tools

```sh
curl -s https://your-docs-site.com/llms-full.txt | pbcopy
# Full docs are now in your clipboard
```
