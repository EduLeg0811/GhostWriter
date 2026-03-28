import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MobilePanelId } from "@/features/ghost-writer/types";

interface MobilePanelHeaderProps {
  activeMobilePanel: MobilePanelId;
  options: Array<{ id: MobilePanelId; label: string; disabled?: boolean }>;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onSelectPanel: (id: MobilePanelId) => void;
}

const MobilePanelHeader = ({
  activeMobilePanel,
  options,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onSelectPanel,
}: MobilePanelHeaderProps) => (
  <div className="relative flex h-14 items-center justify-between border-b border-border bg-card px-3">
    <span className="text-sm font-semibold text-foreground">
      {options.find((option) => option.id === activeMobilePanel)?.label ?? "Painel"}
    </span>
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9"
      onClick={onToggleMobileMenu}
      aria-label="Abrir menu de paineis"
    >
      <Menu className="h-4 w-4" />
    </Button>
    {isMobileMenuOpen && (
      <div className="absolute right-3 top-12 z-20 w-48 rounded-md border border-border bg-card p-1 shadow-lg">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={option.disabled}
            onClick={() => {
              if (option.disabled) return;
              onSelectPanel(option.id);
            }}
            className={`flex w-full items-center rounded px-3 py-2 text-left text-sm ${
              option.id === activeMobilePanel ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    )}
  </div>
);

export default MobilePanelHeader;
