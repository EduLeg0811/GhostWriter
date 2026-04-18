import OverviewSearchPanel from "@/features/ghost-writer/components/OverviewSearchPanel";

interface LexicalOverviewPanelProps {
  title: string;
  description: string;
  term: string;
  maxResults: number;
  queryLabel?: string;
  onTermChange: (value: string) => void;
  onMaxResultsChange: (value: number) => void;
  onRunSearch: () => void;
  isRunning: boolean;
  onClose?: () => void;
  showPanelChrome?: boolean;
}

const LexicalOverviewPanel = (props: LexicalOverviewPanelProps) => (
  <OverviewSearchPanel
    {...props}
    queryLabel={props.queryLabel ?? "Termo"}
  />
);

export default LexicalOverviewPanel;
