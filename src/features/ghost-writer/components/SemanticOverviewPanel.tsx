import OverviewSearchPanel, { type SemanticOverviewConfig } from "@/features/ghost-writer/components/OverviewSearchPanel";

interface SemanticOverviewPanelProps {
  title: string;
  description: string;
  term: string;
  maxResults: number;
  minScore: number | null;
  effectiveMinScorePreview?: number;
  recommendedMinScoreMin?: number;
  recommendedMinScoreMax?: number;
  queryLabel?: string;
  useRagContext: boolean;
  excludeLexicalDuplicates: boolean;
  selectedVectorStoreLabel?: string;
  onTermChange: (value: string) => void;
  onMaxResultsChange: (value: number) => void;
  onMinScoreChange: (value: number | null) => void;
  onUseRagContextChange: (value: boolean) => void;
  onExcludeLexicalDuplicatesChange: (value: boolean) => void;
  onRunSearch: () => void;
  isRunning: boolean;
  onClose?: () => void;
  showPanelChrome?: boolean;
}

const SemanticOverviewPanel = ({
  minScore,
  effectiveMinScorePreview,
  recommendedMinScoreMin,
  recommendedMinScoreMax,
  useRagContext,
  excludeLexicalDuplicates,
  selectedVectorStoreLabel,
  onMinScoreChange,
  onUseRagContextChange,
  onExcludeLexicalDuplicatesChange,
  ...props
}: SemanticOverviewPanelProps) => {
  const semanticConfig: SemanticOverviewConfig = {
    minScore,
    effectiveMinScorePreview,
    recommendedMinScoreMin,
    recommendedMinScoreMax,
    useRagContext,
    excludeLexicalDuplicates,
    selectedVectorStoreLabel,
    onMinScoreChange,
    onUseRagContextChange,
    onExcludeLexicalDuplicatesChange,
  };

  return (
    <OverviewSearchPanel
      {...props}
      queryLabel={props.queryLabel ?? "Query"}
      semanticConfig={semanticConfig}
    />
  );
};

export default SemanticOverviewPanel;
