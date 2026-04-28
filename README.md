# SRE Agent — Interactive UX Prototype

A high-fidelity clickable prototype for **New Relic's SRE Agent** — an AI-powered investigation and incident response tool. Built to explore and validate the end-to-end user experience across 9 critical user journeys.

> This is a **design prototype**, not a production application. All data is mocked. No real New Relic APIs are called.

---

## What's Inside

The prototype covers the full SRE Agent workflow — from alert triage through root cause analysis, war room coordination, and post-mortem generation.

### Pages

| Route | Description |
|-------|-------------|
| `/` | Home dashboard — active investigations, morning brief, SLO overview, agent activity |
| `/investigation/:id` | Investigation Canvas — hypothesis cards, reasoning tree, evidence panel, chat |
| `/investigation/:id/golden-metrics` | Golden metrics charts with time range, annotations, export |
| `/investigation/:id/slo` | SLO budget burn, heatmap, freeze/compliance actions |
| `/investigation/:id/war-room` | Live incident war room — feed, team coordination, status broadcast |
| `/investigation/:id/postmortem` | AI-assisted post-mortem with action items and export |
| `/setup` | Onboarding wizard — connect data sources, configure alert conditions |

Home also includes tabbed views for:
- **Knowledge** — Memory Explorer (personal + team knowledge base)
- **Platform** — MCP integrations and platform hub
- **Settings** — Configuration and memory admin

### Key Interactions

- **Hypothesis cards** — expand/collapse, skip, prioritize, add context, disagree with re-investigation
- **Reasoning tree** — zoomable, replayable, fullscreen, PNG export
- **Chat panel** — guided conversation with AI responses, suggested prompts
- **Memory Explorer** — add, import, approve, archive memories; learning settings
- **War Room** — live feed filtering, status updates to Slack/PD/StatusPage
- **Post-Mortem** — AI accuracy review, Jira ticket creation, Confluence export
- **Demo Launcher** — floating guide to walk through scripted scenarios (bottom-left FAB)

---

## Getting Started

**Requirements:** Node.js 18+

```bash
git clone https://github.com/abhi26121608/sre-agent-mockup
cd sre-agent-mockup
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Other Commands

```bash
npm run build     # production build → dist/
npm run preview   # serve the production build locally
```

---

## Demo Scenarios

Click the **Demo Launcher** button (bottom-left of any page) to access guided walkthroughs:

- **Scenario A** — `checkout-service` P1 latency incident (N+1 query from recent deploy)
- **Scenario B** — Cross-service cascade failure
- **Scenario C** — SLO breach investigation

Each scenario has pre-loaded hypotheses, evidence, entity context, and a guided script.

---

## Tech Stack

- **React 19** + **Vite 8**
- **Tailwind CSS v4** (CSS-native `@theme`, no config file)
- **React Router v6**
- **Framer Motion** — page transitions and micro-animations
- **Recharts** — golden metrics charts
- **Radix UI** — accessible headless components
- **Lucide React** — icons

---

## Project Structure

```
src/
├── pages/           # Top-level route components
├── components/      # Shared UI components
│   ├── home/        # Home dashboard widgets
│   └── ui/          # Base design system (Button, Card, Badge, etc.)
├── data/            # Mock JSON data and scenario scripts
│   └── scenarios/   # Per-scenario investigation data
└── lib/             # Utilities
```

---

## Design Decisions

- **Light theme** — white canvas with dark sidebar chrome, matches New Relic One visual language
- **Dynamic data** — conversations, hypotheses, and evidence are driven by scenario JSON, not hardcoded
- **No backend** — fully static, runs anywhere with just `npm run dev`
- **SITEMAP.md** — complete interaction map documenting every clickable element on every page

---

## Contributing

This is an internal design prototype. If you're extending it:

1. Add new scenario data in `src/data/scenarios/`
2. Follow the existing component patterns in `src/components/`
3. Update `SITEMAP.md` when adding new interactions
