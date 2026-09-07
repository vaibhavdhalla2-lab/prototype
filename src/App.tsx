import { useApp } from "./lib/store";
import TopNav from "./components/TopNav";
import ChatPanel from "./components/chat/ChatPanel";
import LandingScreen from "./components/landing/LandingScreen";
import RightPanel from "./components/RightPanel";
import Canvas from "./components/Canvas";
import MermaidView from "./components/MermaidView";
import DocumentationView from "./components/DocumentationView";
import PlanView from "./components/PlanView";
import BuildProgress from "./components/BuildProgress";
import ModifyPreviewModal from "./components/ModifyPreviewModal";
import EvidencePanel from "./components/EvidencePanel";
import Toasts from "./components/Toasts";

export default function App() {
  const { state } = useApp();

  if (!state.hydrated) {
    return (
      <div className="grid h-screen w-screen place-items-center bg-canvas">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {state.model ? (
        <>
          <TopNav />
          <div className="flex flex-1 overflow-hidden">
            <ChatPanel />
            {state.view === "diagram" && <Canvas />}
            {state.view === "mermaid" && <MermaidView />}
            {state.view === "documentation" && <DocumentationView />}
            <RightPanel />
          </div>
        </>
      ) : (
        <LandingScreen />
      )}

      <PlanView />
      <BuildProgress />
      <ModifyPreviewModal />
      <EvidencePanel />
      <Toasts />
    </div>
  );
}
