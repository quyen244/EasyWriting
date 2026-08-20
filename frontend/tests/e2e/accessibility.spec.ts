import { expect, test, type Page } from "@playwright/test";

import { stubBackend } from "./support/backend";

/**
 * T049 / SC-007 — contrast and keyboard focus across every new page, in both themes.
 *
 * Written as an executable check rather than a manual checklist. SC-007 says "100% of
 * workspace elements pass a legibility check in both themes"; a checklist verifies that
 * once, on the day someone remembers to run it, whereas this fails the build the moment
 * a component picks up a colour that only works in one theme.
 */

/** WCAG relative luminance. */
function luminance([r, g, b]: number[]): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: number[], b: number[]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function parseRgb(value: string): number[] | null {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(",").map((p) => parseFloat(p.trim()));
  // A fully transparent colour tells us nothing about what the reader sees.
  if (parts.length > 3 && parts[3] === 0) return null;
  return parts.slice(0, 3);
}

/**
 * Text contrast for every visible text node, resolved against the nearest ancestor
 * that actually paints a background — which is what the reader's eye does, and what a
 * naive element-level check gets wrong on transparent children.
 */
async function worstTextContrast(page: Page): Promise<{ ratio: number; text: string }> {
  return page.evaluate(() => {
    function lum([r, g, b]: number[]): number {
      const ch = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
    }
    /** Returns [r, g, b, a]; null when the value is not a colour at all. */
    function rgba(value: string): number[] | null {
      const m = value.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(",").map((x) => parseFloat(x.trim()));
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    }
    function rgb(value: string): number[] | null {
      const c = rgba(value);
      return c && c[3] !== 0 ? c.slice(0, 3) : null;
    }

    /**
     * Composites every semi-transparent background up the ancestor chain, which is what
     * the eye actually sees.
     *
     * Treating a partly-transparent layer as opaque is not a rounding error: the design
     * system uses 10%-opacity tints for selected states and feedback chips, and reading
     * `rgba(13,51,104,0.1)` as solid ink blue reports near-zero contrast on text that is
     * in fact perfectly legible.
     */
    function backgroundOf(el: Element): number[] {
      const layers: number[][] = [];
      let node: Element | null = el;
      while (node) {
        const c = rgba(getComputedStyle(node).backgroundColor);
        if (c && c[3] > 0) {
          layers.push(c);
          if (c[3] === 1) break;
        }
        node = node.parentElement;
      }

      // Start from the deepest opaque layer (or white) and paint forwards.
      let base = layers.length && layers[layers.length - 1][3] === 1
        ? layers.pop()!.slice(0, 3)
        : [255, 255, 255];
      for (const layer of layers.reverse()) {
        const a = layer[3];
        base = [0, 1, 2].map((i) => layer[i] * a + base[i] * (1 - a));
      }
      return base;
    }

    let worst = { ratio: 21, text: "" };
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const own = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent?.trim() ?? "")
        .join(" ")
        .trim();
      if (!own) continue;

      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none" || style.opacity === "0") {
        continue;
      }
      if ((el as HTMLElement).offsetParent === null && style.position !== "fixed") continue;

      const fg = rgb(style.color);
      if (!fg) continue;
      const bg = backgroundOf(el);

      const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
      const ratio = (hi + 0.05) / (lo + 0.05);
      if (ratio < worst.ratio) worst = { ratio, text: own.slice(0, 60) };
    }
    return worst;
  });
}

const PUBLIC_PAGES = ["/", "/faq", "/signin", "/signup"];
const PROTECTED_PAGES = ["/workspace", "/profile"];

for (const theme of ["light", "dark"] as const) {
  test.describe(`Contrast — ${theme} theme`, () => {
    for (const path of [...PUBLIC_PAGES, ...PROTECTED_PAGES]) {
      test(`${path} keeps all text above 4.5:1`, async ({ page }) => {
        await stubBackend(page, { signedIn: PROTECTED_PAGES.includes(path) });
        await page.goto(path);
        if (theme === "dark") {
          await page.evaluate(() => {
            localStorage.setItem("writewise.theme", "dark");
          });
          await page.reload();
        }
        await page.waitForLoadState("networkidle");

        const worst = await worstTextContrast(page);
        expect(
          worst.ratio,
          `Lowest-contrast text on ${path} (${theme}): "${worst.text}"`,
        ).toBeGreaterThanOrEqual(4.5);
      });
    }
  });
}

test.describe("Keyboard focus", () => {
  test("the landing page's first interactive element takes a visible focus ring", async ({
    page,
  }) => {
    await stubBackend(page, { signedIn: false });
    await page.goto("/");
    await page.keyboard.press("Tab");

    const outline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return { width: s.outlineWidth, shadow: s.boxShadow, tag: el.tagName };
    });

    expect(outline).not.toBeNull();
    // The global :focus-visible rule uses a Tailwind ring, which paints as a box-shadow.
    expect(outline!.shadow === "none" && outline!.width === "0px").toBe(false);
  });

  test("the essay editor is reachable by keyboard alone", async ({ page }) => {
    await stubBackend(page, { signedIn: true });
    await page.goto("/workspace");
    await page.getByRole("heading", { name: /score an essay/i }).waitFor();

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const id = await page.evaluate(() => document.activeElement?.id);
      if (id === "essay_text") return;
    }
    throw new Error("The essay editor was not reachable within 25 tab stops.");
  });

  test("every criterion panel can be expanded with the keyboard", async ({ page }) => {
    await stubBackend(page, { signedIn: true });
    await page.goto("/workspace");
    await page.locator("#essay_text").fill("word ".repeat(260));
    await page.getByRole("button", { name: /score my essay/i }).click();
    await expect(page.getByTestId("overall-band")).toBeVisible();

    const trigger = page.getByRole("button", { name: /task response/i });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

test("contrast helpers agree with known WCAG values", () => {
  // Guards the maths itself: black on white is 21:1, and identical colours are 1:1.
  expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 1);
  expect(contrastRatio([120, 120, 120], [120, 120, 120])).toBeCloseTo(1, 5);
  expect(parseRgb("rgba(0, 0, 0, 0)")).toBeNull();
});
