import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SectionCard } from "./section-card";

describe("SectionCard", () => {
  it("keeps root overflow visible so sticky action buttons can track viewport scroll", () => {
    const html = renderToStaticMarkup(
      <SectionCard title="テスト" actions={<button type="button">追加</button>}>
        content
      </SectionCard>,
    );

    const rootClass = html.match(/^<div class="([^"]+)"/)?.[1] ?? "";
    expect(rootClass).not.toContain("overflow-hidden");
  });

  it("applies sticky behavior only to floating actions", () => {
    const html = renderToStaticMarkup(
      <SectionCard
        title="テスト"
        actions={<button type="button">通常</button>}
        floatingActions={<button type="button">追加</button>}
      >
        content
      </SectionCard>,
    );

    const headerClass = html.match(/<header class="([^"]+)"/)?.[1] ?? "";
    expect(headerClass).not.toContain("sticky");

    const floatingOverlayClass =
      html.match(/<div class="([^"]*absolute[^"]*inset-x-0[^"]*)">/)?.[1] ?? "";
    expect(floatingOverlayClass).toContain("absolute");
    expect(floatingOverlayClass).toContain("inset-x-0");
    expect(floatingOverlayClass).toContain("pointer-events-none");

    const stickyLayerClass =
      html.match(
        /<div class="([^"]*sticky[^"]*top-3[^"]*)"><div class="[^"]*pointer-events-auto[^"]*">/,
      )?.[1] ?? "";
    expect(stickyLayerClass).toContain("sticky");
    expect(stickyLayerClass).toContain("top-3");

    const floatingClass =
      html.match(
        /<div class="([^"]*pointer-events-auto[^"]*)"><button type="button">追加/,
      )?.[1] ?? "";
    expect(floatingClass).toContain("pointer-events-auto");
    expect(floatingClass).toContain("[&amp;&gt;button]:bg-ui-mantle");
    expect(floatingClass).toContain("[&amp;&gt;button]:border-ui-surface0");
  });

  it("merges custom floating action class names", () => {
    const html = renderToStaticMarkup(
      <SectionCard
        title="テスト"
        floatingActionsClassName="-mt-20"
        floatingActions={<button type="button">追加</button>}
      >
        content
      </SectionCard>,
    );

    const floatingClass =
      html.match(
        /<div class="([^"]*pointer-events-auto[^"]*)"><button type="button">追加/,
      )?.[1] ?? "";
    expect(floatingClass).toContain("-mt-20");
  });
});
