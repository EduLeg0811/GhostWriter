import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ACTION_PANEL_BUTTONS_BY_SCOPE,
  ACTION_PANEL_ICONS,
  APP_PANEL_BUTTONS_BY_SCOPE,
  APP_PANEL_ICONS,
  parameterActionMeta,
  parameterAppMeta,
} from "@/features/ghost-writer/config/metadata";
import type { AiActionId, AppActionId, AppPanelScope, ParameterPanelTarget } from "@/features/ghost-writer/types";
import { sectionActionButtonClass } from "@/styles/buttonStyles";

type NonNullParameterPanelTarget = Exclude<ParameterPanelTarget, null>;

interface ParameterPanelToolbarProps {
  parameterPanelTarget: NonNullParameterPanelTarget;
  appPanelScope: AppPanelScope | null;
  isLoading: boolean;
  isAiActionsConfigOpen: boolean;
  isTermsConceptsConscienciografiaEnabled: boolean;
  hasVerbetografiaRequiredFields: boolean;
  onToggleAiActionsConfig: () => void;
  onToggleTermsConceptsConscienciografia: () => void;
  onOpenAiActionParameters: (id: AiActionId, sectionOverride?: "actions" | "rewriting" | "translation" | "customized_prompts") => void;
  onSelectVerbetografiaAction: (id: AppActionId) => void | Promise<void>;
  onRunAppAction: (id: AppActionId) => void | Promise<void>;
}

const ParameterPanelToolbar = ({
  parameterPanelTarget,
  appPanelScope,
  isLoading,
  isAiActionsConfigOpen,
  isTermsConceptsConscienciografiaEnabled,
  hasVerbetografiaRequiredFields,
  onToggleAiActionsConfig,
  onToggleTermsConceptsConscienciografia,
  onOpenAiActionParameters,
  onSelectVerbetografiaAction,
  onRunAppAction,
}: ParameterPanelToolbarProps) => {
  const resolvedAiSection = parameterPanelTarget.section;

  const renderAiActionButton = (id: AiActionId) => {
    const Icon = ACTION_PANEL_ICONS[id];

    return (
      <Button
        key={id}
        variant="ghost"
        className={sectionActionButtonClass}
        onClick={() => onOpenAiActionParameters(id)}
        disabled={isLoading}
      >
        <Icon className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
        <span className="min-w-0 flex-1 text-left">
          <span className="block break-words text-sm font-medium text-foreground">{parameterActionMeta[id].title}</span>
          <span className="block break-words text-xs text-muted-foreground">{parameterActionMeta[id].description}</span>
        </span>
      </Button>
    );
  };

  const isAiActionSection =
    resolvedAiSection === "actions"
    || resolvedAiSection === "rewriting"
    || resolvedAiSection === "translation"
    || resolvedAiSection === "customized_prompts";
  const supportsAiConfig = isAiActionSection;
  const isVerbetografiaTablePanel = parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app7";
  const showTermsConceptsConscienciografiaPill =
    resolvedAiSection === "actions"
    || resolvedAiSection === "rewriting"
    || resolvedAiSection === "translation"
    || resolvedAiSection === "customized_prompts";
  const showToolbar = parameterPanelTarget.section !== "document"
    && parameterPanelTarget.section !== "sources"
    && parameterPanelTarget.section !== "applications"
    && !(parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app12")
    && !isVerbetografiaTablePanel;

  if (!showToolbar) return null;

  return (
    <div className="border-b border-border p-3">
      <div className="grid grid-cols-1 gap-2">
        {isAiActionSection ? (
          <>
            {supportsAiConfig ? (
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {showTermsConceptsConscienciografiaPill ? (
                    <button
                      type="button"
                      onClick={onToggleTermsConceptsConscienciografia}
                      aria-pressed={isTermsConceptsConscienciografiaEnabled}
                      className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        isTermsConceptsConscienciografiaEnabled
                          ? "border-orange-300 bg-orange-100 text-orange-900 shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-500"
                      }`}
                    >
                      Conscienciografia
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onToggleAiActionsConfig}
                  title={isAiActionsConfigOpen ? "Ocultar configurações IA" : "Mostrar configurações IA"}
                  aria-label={isAiActionsConfigOpen ? "Ocultar configurações IA" : "Mostrar configurações IA"}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md border shadow-sm transition ${
                    isAiActionsConfigOpen
                      ? "border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-200 hover:text-blue-950"
                      : "border-border bg-white text-muted-foreground hover:bg-zinc-50 hover:text-foreground"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            {ACTION_PANEL_BUTTONS_BY_SCOPE[resolvedAiSection as Exclude<typeof resolvedAiSection, "document" | "sources" | "applications" | "apps">].map((id) => {
              if (resolvedAiSection !== "actions") {
                return renderAiActionButton(id);
              }

              return null;
            })}





            {/* Palavras */}
            {/* _____________________________________________________________________ */}
            {resolvedAiSection === "actions" ? (
              <div className="space-y-1.5">
                {/* <p className="pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Palavras</p> */}
                {ACTION_PANEL_BUTTONS_BY_SCOPE.actions.map(renderAiActionButton)}
              </div>
            ) : null}
          </>
        ) : null}

        {parameterPanelTarget.section === "apps" ? APP_PANEL_BUTTONS_BY_SCOPE[appPanelScope ?? "bibliografia"].map((id) => {
          const Icon = APP_PANEL_ICONS[id];
          const isVerbetografiaAction = id === "app7" || id === "app8" || id === "app11" || id === "app9" || id === "app10";
          const appButtonTitle = appPanelScope === "verbetografia" && id === "app7" ? "Tabela Verbete" : parameterAppMeta[id].title;

          return (
            <div key={id} className="space-y-2">
              {appPanelScope === "verbetografia" && id === "app8" ? (
                <>
                  <div className="mb-1 flex justify-end">
                    <button
                      type="button"
                      onClick={onToggleAiActionsConfig}
                      title={isAiActionsConfigOpen ? "Ocultar configurações IA" : "Mostrar configurações IA"}
                      aria-label={isAiActionsConfigOpen ? "Ocultar configurações IA" : "Mostrar configurações IA"}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border shadow-sm transition ${
                        isAiActionsConfigOpen
                          ? "border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-200 hover:text-blue-950"
                          : "border-border bg-white text-muted-foreground hover:bg-zinc-50 hover:text-foreground"
                      }`}
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : null}
              <Button
                variant="ghost"
                className={sectionActionButtonClass}
                onClick={() => void (isVerbetografiaAction ? onSelectVerbetografiaAction(id) : onRunAppAction(id))}
                disabled={isLoading}
              >
                <Icon className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block break-words text-sm font-medium text-foreground">{appButtonTitle}</span>
                  <span className="block break-words text-xs text-muted-foreground">{parameterAppMeta[id].description}</span>
                </span>
              </Button>
            </div>
          );
        }) : null}
      </div>
    </div>
  );
};

export default ParameterPanelToolbar;
