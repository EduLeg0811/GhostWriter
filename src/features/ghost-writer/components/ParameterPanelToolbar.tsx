import { PenLine, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LLM_VECTOR_STORE_LO } from "@/lib/openai";
import { ACTION_PANEL_BUTTONS_BY_SCOPE, ACTION_PANEL_ICONS, APP_PANEL_BUTTONS_BY_SCOPE, APP_PANEL_ICONS, parameterActionMeta, parameterAppMeta } from "@/features/ghost-writer/config/metadata";
import type { AiActionId, AppActionId, AppPanelScope, ParameterPanelTarget } from "@/features/ghost-writer/types";
import { sectionActionButtonClass } from "@/styles/buttonStyles";

type NonNullParameterPanelTarget = Exclude<ParameterPanelTarget, null>;

interface ParameterPanelToolbarProps {
  parameterPanelTarget: NonNullParameterPanelTarget;
  appPanelScope: AppPanelScope | null;
  isLoading: boolean;
  isAiActionsConfigOpen: boolean;
  hasVerbetografiaRequiredFields: boolean;
  onToggleAiActionsConfig: () => void;
  onOpenAiActionParameters: (id: AiActionId) => void;
  onSelectVerbetografiaAction: (id: AppActionId) => void | Promise<void>;
  onRunAppAction: (id: AppActionId) => void | Promise<void>;
}

const ParameterPanelToolbar = ({
  parameterPanelTarget,
  appPanelScope,
  isLoading,
  isAiActionsConfigOpen,
  hasVerbetografiaRequiredFields,
  onToggleAiActionsConfig,
  onOpenAiActionParameters,
  onSelectVerbetografiaAction,
  onRunAppAction,
}: ParameterPanelToolbarProps) => {
  const isAiActionSection =
    parameterPanelTarget.section === "actions"
    || parameterPanelTarget.section === "rewriting"
    || parameterPanelTarget.section === "translation"
    || parameterPanelTarget.section === "customized_prompts";
  const supportsAiConfig = isAiActionSection && parameterPanelTarget.id !== "dict_lookup";
  const isAiCommandSection = parameterPanelTarget.section === "actions" && parameterPanelTarget.id === "ai_command";
  const isVerbetografiaTablePanel = parameterPanelTarget.section === "apps" && parameterPanelTarget.id === "app7";
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
              <div className="mb-1 flex justify-end">
                <button
                  type="button"
                  onClick={onToggleAiActionsConfig}
                  title={isAiActionsConfigOpen ? "Ocultar configurações IA" : "Mostrar configurações IA"}
                  aria-label={isAiActionsConfigOpen ? "Ocultar configurações IA" : "Mostrar configurações IA"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted-foreground shadow-sm transition hover:bg-zinc-50 hover:text-foreground"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            {isAiCommandSection ? (
              <Button
                variant="ghost"
                className={sectionActionButtonClass}
                onClick={() => onOpenAiActionParameters("ai_command")}
                disabled={isLoading}
              >
                <PenLine className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block break-words text-sm font-medium text-foreground">{parameterActionMeta.ai_command.title}</span>
                  <span className="block break-words text-xs text-muted-foreground">{parameterActionMeta.ai_command.description}</span>
                </span>
              </Button>
            ) : ACTION_PANEL_BUTTONS_BY_SCOPE[parameterPanelTarget.section].map((id) => {
              const Icon = ACTION_PANEL_ICONS[id];
              return (
                <Button
                  key={id}
                  variant="ghost"
                  className={sectionActionButtonClass}
                  onClick={() => onOpenAiActionParameters(id)}
                  disabled={isLoading || (id === "pensatas" && !LLM_VECTOR_STORE_LO)}
                >
                  <Icon className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block break-words text-sm font-medium text-foreground">{parameterActionMeta[id].title}</span>
                    <span className="block break-words text-xs text-muted-foreground">{parameterActionMeta[id].description}</span>
                  </span>
                </Button>
              );
            })}
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted-foreground shadow-sm transition hover:bg-zinc-50 hover:text-foreground"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Seções do Verbete</p>
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
