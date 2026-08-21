import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:3140";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// Scroll the whole page the way a reader would, so every observer fires.
const height = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < height; y += 500) {
  await page.evaluate((to) => window.scrollTo(0, to), y);
  await page.waitForTimeout(160);
}
await page.waitForTimeout(1200);

const stuck = await page.evaluate(() =>
  Array.from(document.querySelectorAll("[data-reveal]"))
    .map((el) => {
      const s = getComputedStyle(el);
      return {
        opacity: s.opacity,
        clip: s.clipPath,
        text: (el.textContent || "").trim().slice(0, 46),
      };
    })
    .filter((r) => Number(r.opacity) < 0.99 || (r.clip !== "none" && !r.clip.includes("0%"))),
);

console.log("total [data-reveal]:", await page.locator("[data-reveal]").count());
console.log("still hidden after full scroll:", stuck.length);
for (const s of stuck) console.log("  ", JSON.stringify(s));

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.screenshot({ path: `${process.env.SHOT_DIR}/11-after-scroll.png`, fullPage: true });

await browser.close();
