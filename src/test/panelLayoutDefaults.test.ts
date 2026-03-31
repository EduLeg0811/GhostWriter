import { describe, expect, it } from "vitest";
import { PANEL_SIZES, getDefaultDesktopPanelLayout } from "@/features/ghost-writer/config/constants";

describe("getDefaultDesktopPanelLayout", () => {
  it("preserves fixed panel defaults and fits the initial desktop layout into 100%", () => {
    const layout = getDefaultDesktopPanelLayout({
      hasCenterPanel: true,
      hasJsonPanel: false,
      hasEditorPanel: true,
    });

    expect(layout.left).toBe(PANEL_SIZES.left.default);
    expect(layout.parameter).toBe(PANEL_SIZES.parameter.default);
    expect(layout.right + (layout.editor ?? 0) + layout.left + (layout.parameter ?? 0)).toBeCloseTo(100, 3);
  });

  it("distributes the remaining width proportionally across flexible panels", () => {
    const layout = getDefaultDesktopPanelLayout({
      hasCenterPanel: false,
      hasJsonPanel: true,
      hasEditorPanel: true,
    });

    expect(layout.left).toBe(PANEL_SIZES.left.default);
    expect(layout.parameter).toBeNull();
    expect(layout.right).toBeCloseTo(40.909, 3);
    expect(layout.json).toBeCloseTo(24.545, 3);
    expect(layout.editor).toBeCloseTo(24.545, 3);
    expect(layout.left + layout.right + (layout.json ?? 0) + (layout.editor ?? 0)).toBeCloseTo(100, 2);
  });
});
