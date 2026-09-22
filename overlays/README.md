# DeepSeek Harness Integrations & Domain Overlays (140 Packaged Add-Ons)

This directory provides production-ready Cordis profile overlays for DeepSeek Harness. Using the native `@deepseek-ai/dsh-mcp-client` bridge, these overlays connect DeepSeek Harness to external services, APIs, and Model Context Protocol (MCP) servers across 7 domains (140 integrations in total).

---

## Architecture

DeepSeek Harness boots from ordered plugin bundle layers configured via Cordis. An overlay patch file passed via `--patch <path>` is applied on top of the active profile (e.g., `web` or `headless`), inserting or overriding configuration rows without modifying core monorepo packages.

When an integration overlay is mounted:
1. `@deepseek-ai/dsh-mcp-client` establishes connections to configured MCP servers via `stdio` (local subprocess) or `streamable-http`.
2. Server tools and capabilities are dynamically registered on `ctx.tools` under a clean server namespace (e.g., `mcp__calendar__list_events`, `mcp__ebay__search_deals`).
3. `failOnStartupError: false` guarantees that if any optional service is unconfigured or offline, the harness boots smoothly without interruption and reconnects when available.

---

## Domain Overlays

| Overlay File | Domain Focus | Integrations Count | Key Capabilities |
|---|---|:---:|---|
| [`01-life-management.patch.yml`](./01-life-management.patch.yml) | Central Life Management | 20 | Calendar, Health, Finance, Notes, Home Assistant, Messaging, Tasks, Vault |
| [`02-ecommerce-arbitrage.patch.yml`](./02-ecommerce-arbitrage.patch.yml) | Commerce & Arbitrage | 20 | eBay, Amazon SP-API, Shopify, Gumroad, Ticketmaster, Freelance, StockX |
| [`03-financial-autonomy.patch.yml`](./03-financial-autonomy.patch.yml) | Financial Autonomy | 20 | Crypto exchanges, Alpaca Equities, Real Estate MLS, Stripe, Cloud Cost, Web3 |
| [`04-enterprise-devops.patch.yml`](./04-enterprise-devops.patch.yml) | Enterprise & DevOps | 20 | GitHub Org, GitLab, PagerDuty, Docker, Kubernetes, Sentry, Datadog, AWS |
| [`05-growth-marketing.patch.yml`](./05-growth-marketing.patch.yml) | Growth & Social | 20 | Buffer, Substack, Apollo, Ads, HubSpot, Discord, Email Broadcasts |
| [`06-ai-multimodal-infra.patch.yml`](./06-ai-multimodal-infra.patch.yml) | AI & Perception | 20 | Brave SERP, Vector DBs (Pinecone, Qdrant), Firecrawl, Vision, ElevenLabs |
| [`07-creative-endeavor.patch.yml`](./07-creative-endeavor.patch.yml) | Creative & Media | 20 | Ableton MIDI, Blender 3D, Figma, Scrivener, Unity/Unreal, Runway, Suno |
| [`all-integrations.patch.yml`](./all-integrations.patch.yml) | **Master Catalog** | **140** | All 140 integrations combined in a unified composition |

---

## Launch Instructions

### 1. Web Application with Domain Overlays

Launch the browser UI with any domain overlay:

```sh
# Launch Life Management
pnpm dsh web --patch overlays/01-life-management.patch.yml

# Launch E-Commerce & Arbitrage
pnpm dsh web --patch overlays/02-ecommerce-arbitrage.patch.yml

# Launch Master Integration Suite (All 140 Integrations)
pnpm dsh web --patch overlays/all-integrations.patch.yml
```

### 2. Headless CLI Task Execution

Execute one-shot autonomous agent tasks using the headless profile:

```sh
# Run a calendar & daily briefing task
pnpm dsh headless --patch overlays/01-life-management.patch.yml "Review my schedule and provide today's briefing"

# Run an arbitrage deal scan
pnpm dsh headless --patch overlays/02-ecommerce-arbitrage.patch.yml "Scan eBay deals for items ending soon with positive margin"
```

### 3. Verify Configuration

Inspect the composed Cordis plugin tree before running:

```sh
pnpm dsh --profile headless --patch overlays/all-integrations.patch.yml --dump-config
```

---

## Environment & Credential Configuration

In accordance with repository credential hygiene, API tokens and keys should be supplied via environment variables or `.env` files (managed securely via EnvSitter tools).

Key variables recognized across overlays:
- **Personal & Life:** `TODOIST_API_TOKEN`, `OURA_PERSONAL_ACCESS_TOKEN`, `HASS_TOKEN`, `TELEGRAM_BOT_TOKEN`, `OPENWEATHER_API_KEY`
- **Commerce:** `EBAY_APP_ID`, `EBAY_CERT_ID`, `SHOPIFY_ACCESS_TOKEN`, `GUMROAD_ACCESS_TOKEN`, `AMAZON_REFRESH_TOKEN`
- **Financial:** `COINBASE_API_KEY`, `ALPACA_API_KEY_ID`, `STRIPE_SECRET_KEY`, `ETH_RPC_URL`, `SOLANA_RPC_URL`
- **DevOps:** `GITHUB_TOKEN`, `GITLAB_TOKEN`, `PAGERDUTY_API_KEY`, `SENTRY_AUTH_TOKEN`, `DATADOG_API_KEY`
- **Marketing:** `BUFFER_ACCESS_TOKEN`, `HUBSPOT_ACCESS_TOKEN`, `DISCORD_BOT_TOKEN`, `SEMRUSH_API_KEY`
- **AI Infrastructure:** `BRAVE_API_KEY`, `PINECONE_API_KEY`, `FIRECRAWL_API_KEY`, `OPENROUTER_API_KEY`, `ELEVENLABS_API_KEY`
- **Creative:** `FIGMA_ACCESS_TOKEN`, `RUNWAY_API_SECRET`, `CIVITAI_API_KEY`, `SUNO_API_KEY`
