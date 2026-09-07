# FlowBuilder AI

An AI-native block diagram agent. Describe a process, system, or workflow in natural language and FlowBuilder AI turns it into an interactive process diagram — then keeps refining it conversationally, the same way you'd pair with a coding agent.

All AI behavior (prompt enhancement, planning, diagram generation, component modification, documentation) is simulated on the client with realistic staged loading, so the prototype runs entirely in the browser with no backend or API key. The simulated logic lives behind a clean service boundary (`src/lib/ai.ts`) so a real LLM/agent API can replace it later without touching the UI.

## Running locally

```bash
npm install
npm run dev
```

Open the app, describe a process, and click **Generate** — or click **Load demo process** for a fully populated Order-to-Cash example, or **+ → Choose Template** for a gallery of ready-made process shapes.

## Highlights

- **Landing prompt screen** — a focused, dark, AI-native composer: describe a process, enhance the prompt, choose **Build** (generate immediately) or **Plan** (review a structured plan first), attach documents/video, or start from a template
- **Template gallery** — 7 ready-made diagrams (Basic Process Flow, Approval Workflow, Customer Complaint Resolution, Order-to-Cash, Incident Management, Employee Onboarding, System Architecture) with live mini-previews
- **30/70 workspace** — an AI conversation panel alongside a large diagram canvas, once a diagram exists
- **Conversational refinement** — select a component and ask AI to modify just that part of the diagram (add an exception, split a step, change owner, etc.), with a diff preview before changes are applied; or ask for changes to the whole diagram from the chat composer
- Every AI-generated component can cite its evidence (document/email/Slack/video) via an evidence drawer
- A live Mermaid code view that's bidirectionally synced with the diagram, with validation, line-level error reporting, and stable component IDs that survive edits
- Diagram-level and component-level threaded comments, with badges on affected nodes
- Version history with restore (a restored version becomes the newest, history is never destroyed) alongside full undo/redo
- Auto-generated, editable process documentation (SOP)
- Export to PNG (high-resolution, full diagram), DOCX, PDF, and Mermaid source
- State persists to `localStorage` across reloads — diagram, chat, comments, and versions all survive a refresh

## Stack

Vite, React 19, TypeScript, Tailwind CSS v4. Exports powered by `jspdf`, `docx`, and `html-to-image`.

## Structure

```
src/
  components/
    landing/      hero prompt screen (pre-generation)
    chat/         AI conversation panel (post-generation)
    templates/    template gallery + mini SVG previews
    shared/       reusable composer bits (attach menu, mode dropdown)
    ...           canvas, inspector, comments, mermaid view, docs, export
  data/           demo process + block diagram templates
  lib/            ai.ts (mock DiagramAgentService), mermaid.ts, layout.ts, store.tsx, export.ts
  types.ts        shared data model
```
