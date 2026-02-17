import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ListOrdered, Loader2, X } from "lucide-react";
import { primaryActionButtonClass } from "@/styles/buttonStyles";

export type Macro2SpacingMode = "normal_single" | "normal_double" | "nbsp_single" | "nbsp_double";

interface Macro2ManualNumberingPanelProps {
  title: string;
  description: string;
  spacingMode: Macro2SpacingMode;
  onSpacingModeChange: (value: Macro2SpacingMode) => void;
  isRunning: boolean;
  onRun: () => void;
  onClose: () => void;
}

const Macro2ManualNumberingPanel = ({
  title,
  description,
  spacingMode,
  onSpacingModeChange,
  isRunning,
  onRun,
  onClose,
}: Macro2ManualNumberingPanelProps) => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-[hsl(var(--panel-header))] px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Parameters</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Fechar Parameters">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>

          
{/*
          <Separator />

           <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acao</Label>
            <p className="text-xs text-muted-foreground">
              Aplica numeração manual ao texto selecionado, preservando a formatação interna.
            </p>
          </div> */}

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Espaçamento</Label>
            <div className="space-y-1 text-xs text-foreground">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="macro2-spacing-mode"
                  value="normal_single"
                  checked={spacingMode === "normal_single"}
                  onChange={() => onSpacingModeChange("normal_single")}
                />
                <span>Espaço simples</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="macro2-spacing-mode"
                  value="normal_double"
                  checked={spacingMode === "normal_double"}
                  onChange={() => onSpacingModeChange("normal_double")}
                />
                <span>Espaço duplo</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="macro2-spacing-mode"
                  value="nbsp_single"
                  checked={spacingMode === "nbsp_single"}
                  onChange={() => onSpacingModeChange("nbsp_single")}
                />
                <span>Espaço rígido simples</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="macro2-spacing-mode"
                  value="nbsp_double"
                  checked={spacingMode === "nbsp_double"}
                  onChange={() => onSpacingModeChange("nbsp_double")}
                />
                <span>Espaço rígido duplo</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button variant="secondary" size="sm" className={primaryActionButtonClass} onClick={onRun} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-black relative z-10" />
                  <span className="relative z-10 text-blue-500">Aplicando</span>
                </>
              ) : (
                <>
                  <ListOrdered className="mr-2 h-4 w-4 text-black relative z-10" />
                  <span className="relative z-10 text-blue-500">Numerar Lista</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Macro2ManualNumberingPanel;
