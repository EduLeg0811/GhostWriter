export type DesktopFixedPanelWidthsPx = {
  left: number;
  parameter: number;
  editor: number;
  json: number;
};

export type DesktopResizablePanelKey = keyof DesktopFixedPanelWidthsPx;

interface GetRightPanelWidthPxParams {
  containerWidthPx: number;
  leftWidthPx: number;
  parameterWidthPx: number;
  editorWidthPx: number;
  jsonWidthPx: number;
  hasCenterPanel: boolean;
  hasEditorPanel: boolean;
  hasJsonPanel: boolean;
  rightMinPx: number;
}

export const clampToMin = (widthPx: number, minPx: number) => Math.max(minPx, Math.round(widthPx));

export const getRightPanelWidthPx = ({
  containerWidthPx,
  leftWidthPx,
  parameterWidthPx,
  editorWidthPx,
  jsonWidthPx,
  hasCenterPanel,
  hasEditorPanel,
  hasJsonPanel,
  rightMinPx,
}: GetRightPanelWidthPxParams) => {
  const fixedWidthPx = leftWidthPx
    + (hasCenterPanel ? parameterWidthPx : 0)
    + (hasEditorPanel ? editorWidthPx : 0)
    + (hasJsonPanel ? jsonWidthPx : 0);

  return Math.max(rightMinPx, containerWidthPx - fixedWidthPx);
};

export const getDesktopMinimumContentWidthPx = ({
  leftWidthPx,
  parameterWidthPx,
  editorWidthPx,
  jsonWidthPx,
  hasCenterPanel,
  hasEditorPanel,
  hasJsonPanel,
  rightMinPx,
}: Omit<GetRightPanelWidthPxParams, "containerWidthPx">) => leftWidthPx
  + (hasCenterPanel ? parameterWidthPx : 0)
  + (hasEditorPanel ? editorWidthPx : 0)
  + (hasJsonPanel ? jsonWidthPx : 0)
  + rightMinPx;
