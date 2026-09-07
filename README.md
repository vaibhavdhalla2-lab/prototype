# FlowBuilder AI

A functional prototype of an AI-powered process flow / block diagram builder. Describe a process in a prompt, or attach documents and video, and FlowBuilder AI produces an editable process plan, an interactive diagram, the underlying Mermaid source, and generated SOP documentation — with every step traceable back to its evidence.

All AI behavior (prompt enhancement, planning, diagram generation, component modification, documentation) is simulated on the client with realistic staged loading, so the prototype runs entirely in the browser with no backend or API key.

## Running locally

```bash
npm install
npm run dev
```

Open the app and click **Load demo process** for a fully populated example (Customer Refund Process), or describe your own process from scratch.

## Highlights

- Prompt, document, and video inputs with simulated processing and a live context summary
- Prompt enhancement with an original/enhanced side-by-side compare
- Plan mode: an editable AI-proposed plan (steps, actors, decisions, gaps) before anything is built
- Build mode: staged progress, then an interactive SVG diagram with pan/zoom/fit and draggable-free layered layout
- Every component cites its evidence (document/email/Slack/video) with an evidence drawer
- "Ask AI to Modify" on any component, with a diff preview before changes are applied
- A live Mermaid code view that's bidirectionally synced with the diagram, with validation and line-level error reporting
- Diagram-level and component-level threaded comments
- Full undo/redo history with keyboard shortcuts
- Auto-generated, editable process documentation (SOP)
- Export to PDF, DOCX, and Mermaid
- State persists to `localStorage` across reloads

## Stack

Vite, React 19, TypeScript, Tailwind CSS v4. Exports powered by `jspdf`, `docx`, and `html-to-image`.
