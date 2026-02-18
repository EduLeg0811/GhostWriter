import { useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Play, X } from "lucide-react";
import { primaryActionButtonClass } from "@/styles/buttonStyles";

interface AiActionParametersPanelProps {
  title: string;
  description: string;
  actionText: string;
  onActionTextChange: (value: string) => void;
  onRetrieveSelectedText: () => void;
  onApply: () => void;
  isLoading: boolean;
  hasDocumentOpen: boolean;
  showLanguageSelect?: boolean;
  languageOptions?: Array<{ value: string; label: string }>;
  selectedLanguage?: string;
  onSelectedLanguageChange?: (value: string) => void;
  onClose?: () => void;
  showPanelChrome?: boolean;
}

const AiActionParametersPanel = ({
  title,
  description,
  actionText,
  onActionTextChange,
  onRetrieveSelectedText,
  onApply,
  isLoading,
  hasDocumentOpen,
  showLanguageSelect = false,
  languageOptions = [],
  selectedLanguage = "",
  onSelectedLanguageChange,
  onClose,
  showPanelChrome = true,
}: AiActionParametersPanelProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    resizeTextarea();
  }, [actionText]);

  const content = (
    <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
      <div className="space-y-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caixa de Entrada</Label>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs font-medium hover:bg-primary/5"
              onClick={onRetrieveSelectedText}
              disabled={isLoading || !hasDocumentOpen}
            >
              <span className="text-blue-500">Select & Import</span>
              <ArrowLeft className="ml-2 h-4 w-4 shrink-0 text-blue-500" />
            </Button>
          </div>
          <textarea
            ref={textareaRef}
            rows={6}
            value={actionText}
            onChange={(e) => {
              onActionTextChange(e.target.value);
              resizeTextarea();
            }}
            placeholder="Select text in the document and click to get selection."
            className="min-h-[110px] w-full overflow-hidden resize-none rounded-md border border-border bg-white px-3 py-2 text-xs outline-none focus:border-primary"
          />
        </div>

        {showLanguageSelect && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Idioma de Saida</Label>
            <select
              value={selectedLanguage}
              onChange={(e) => onSelectedLanguageChange?.(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-white px-3 text-xs outline-none focus:border-primary"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button
          variant="secondary"
          size="sm"
          className={primaryActionButtonClass}
          onClick={onApply}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-black relative z-10" />
              <span className="relative z-10 text-blue-500">{title}</span>
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4 text-black relative z-10" />
              <span className="relative z-10 text-blue-500">{title}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (!showPanelChrome) return content;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-[hsl(var(--panel-header))] px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Parameters</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Fechar Parameters">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {content}
    </div>
  );
};

export default AiActionParametersPanel;
