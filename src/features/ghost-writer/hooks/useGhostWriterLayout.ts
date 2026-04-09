import { useEffect, useMemo, useRef, useState } from "react";
import type { AppPanelScope, LlmConfigPanelId, MobilePanelId, ParameterPanelTarget, SourcesPanelView } from "@/features/ghost-writer/types";

interface UseGhostWriterLayoutParams {
  hasEditorPanel: boolean;
}

const useGhostWriterLayout = ({ hasEditorPanel }: UseGhostWriterLayoutParams) => {
  const [parameterPanelTarget, setParameterPanelTarget] = useState<ParameterPanelTarget>(null);
  const [appPanelScope, setAppPanelScope] = useState<AppPanelScope | null>(null);
  const [activeLlmConfigPanel, setActiveLlmConfigPanel] = useState<LlmConfigPanelId | null>(null);
  const [isJsonLogPanelOpen, setIsJsonLogPanelOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = useState<MobilePanelId>("left");
  const [sourcesPanelView, setSourcesPanelView] = useState<SourcesPanelView>(null);
  const previousHasEditorPanelRef = useRef(false);

  const isChatConfigOpen = parameterPanelTarget?.section === "sources";
  const isAiActionsConfigOpen = activeLlmConfigPanel === "ai_actions";
  const isBiblioExternaConfigOpen = activeLlmConfigPanel === "biblio_externa";
  const hasCenterPanel = Boolean(parameterPanelTarget);
  const hasJsonPanel = isJsonLogPanelOpen;
  const mobilePanelOptions: Array<{ id: MobilePanelId; label: string; disabled?: boolean }> = useMemo(() => [
    { id: "left", label: "Menu" },
    { id: "center", label: "Parametros", disabled: !hasCenterPanel },
    { id: "right", label: "Historico" },
    { id: "editor", label: "Editor", disabled: !hasEditorPanel },
    { id: "json", label: "Logs", disabled: !hasJsonPanel },
  ], [hasCenterPanel, hasEditorPanel, hasJsonPanel]);

  const showJsonPanel = hasJsonPanel && (!isMobileView || activeMobilePanel === "json");
  const showLeftPanel = !isMobileView || activeMobilePanel === "left";
  const showCenterPanel = hasCenterPanel && (!isMobileView || activeMobilePanel === "center");
  const showRightPanel = !isMobileView || activeMobilePanel === "right";
  const showEditorPanel = hasEditorPanel && (!isMobileView || activeMobilePanel === "editor");
  const showHandleAfterLeft = showLeftPanel && (showCenterPanel || showRightPanel || showEditorPanel);
  const showHandleAfterCenter = showCenterPanel && (showRightPanel || showEditorPanel);
  const showHandleAfterRight = showRightPanel && (showJsonPanel || showEditorPanel);
  const showHandleAfterJson = showJsonPanel && showEditorPanel;

  const toggleLlmConfigPanel = (panel: LlmConfigPanelId) => {
    setActiveLlmConfigPanel((prev) => (prev === panel ? null : panel));
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const applyMobileState = (isMobile: boolean) => {
      setIsMobileView(isMobile);
    };
    applyMobileState(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => applyMobileState(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!isMobileView) return;
    if (activeMobilePanel === "json" && !hasJsonPanel) {
      setActiveMobilePanel("left");
      return;
    }
    if (activeMobilePanel === "center" && !hasCenterPanel) {
      setActiveMobilePanel(hasEditorPanel ? "editor" : "left");
      return;
    }
    if (activeMobilePanel === "editor" && !hasEditorPanel) {
      setActiveMobilePanel("left");
    }
  }, [activeMobilePanel, hasCenterPanel, hasEditorPanel, hasJsonPanel, isMobileView]);

  useEffect(() => {
    if (!isMobileView) {
      previousHasEditorPanelRef.current = hasEditorPanel;
      return;
    }
    if (!previousHasEditorPanelRef.current && hasEditorPanel) {
      setActiveMobilePanel("editor");
    }
    previousHasEditorPanelRef.current = hasEditorPanel;
  }, [hasEditorPanel, isMobileView]);

  return {
    parameterPanelTarget,
    setParameterPanelTarget,
    appPanelScope,
    setAppPanelScope,
    activeLlmConfigPanel,
    setActiveLlmConfigPanel,
    isJsonLogPanelOpen,
    setIsJsonLogPanelOpen,
    isMobileView,
    activeMobilePanel,
    setActiveMobilePanel,
    sourcesPanelView,
    setSourcesPanelView,
    isChatConfigOpen,
    isAiActionsConfigOpen,
    isBiblioExternaConfigOpen,
    hasCenterPanel,
    hasJsonPanel,
    mobilePanelOptions,
    showJsonPanel,
    showLeftPanel,
    showCenterPanel,
    showRightPanel,
    showEditorPanel,
    showHandleAfterLeft,
    showHandleAfterCenter,
    showHandleAfterRight,
    showHandleAfterJson,
    toggleLlmConfigPanel,
  };
};

export default useGhostWriterLayout;
