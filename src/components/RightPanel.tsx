import { useApp } from "../lib/store";
import InspectorPanel from "./InspectorPanel";
import CommentsPanel from "./CommentsPanel";
import { IconChevronRight } from "./icons";

export default function RightPanel() {
  const { state, dispatch } = useApp();

  if (!state.rightPanelOpen) {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center border-l border-border bg-surface py-3">
        <button
          onClick={() => dispatch({ type: "TOGGLE_RIGHT_PANEL" })}
          className="grid h-8 w-8 place-items-center rounded-md text-ink-soft hover:bg-surface-2"
          title="Expand panel"
        >
          <IconChevronRight className="rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border-soft px-3 py-2">
        <div className="flex gap-1">
          <TabButton active={state.rightPanelMode === "inspector"} onClick={() => dispatch({ type: "SET_RIGHT_PANEL_MODE", mode: "inspector" })}>
            Inspector
          </TabButton>
          <TabButton active={state.rightPanelMode === "comments"} onClick={() => dispatch({ type: "SET_RIGHT_PANEL_MODE", mode: "comments" })}>
            Comments
          </TabButton>
        </div>
        <button
          onClick={() => dispatch({ type: "TOGGLE_RIGHT_PANEL" })}
          className="grid h-7 w-7 place-items-center rounded-md text-ink-faint hover:bg-surface-2 hover:text-ink"
          title="Collapse panel"
        >
          <IconChevronRight />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">{state.rightPanelMode === "inspector" ? <InspectorPanel /> : <CommentsPanel />}</div>
    </aside>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${active ? "bg-brand-soft text-brand-deep" : "text-ink-faint hover:bg-surface-2 hover:text-ink-soft"}`}
    >
      {children}
    </button>
  );
}
