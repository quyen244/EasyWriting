import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:3140";
const OUT = process.env.SHOT_DIR;

const browser = await chromium.launch();

async function shoot(page, name, opts = {}) {
  await page.screenshot({ path: `${OUT}/${name}.png`, ...opts });
  console.log("shot:", name);
}

// ---------- desktop ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.log("CONSOLE ERROR:", m.text());
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await shoot(page, "01-hero-desktop");

  // Demo phases: typing -> scoring -> revealed.
  await page.waitForTimeout(4200);
  await shoot(page, "02-demo-scoring", { clip: { x: 800, y: 90, width: 640, height: 560 } });
  await page.waitForTimeout(4200);
  await shoot(page, "03-demo-revealed", { clip: { x: 800, y: 90, width: 640, height: 560 } });

  // Dropdown.
  await page.getByRole("button", { name: "Grader", exact: true }).click();
  await page.waitForTimeout(450);
  await shoot(page, "04-dropdown", { clip: { x: 0, y: 0, width: 1440, height: 420 } });
  await page.keyboard.press("Escape");

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await shoot(page, "05-fullpage-desktop", { fullPage: true });

  await ctx.close();
}

// ---------- reduced motion ----------
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await shoot(page, "06-reduced-motion");
  await ctx.close();
}

// ---------- mobile ----------
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await shoot(page, "07-hero-mobile");

  await page.getByRole("button", { name: /open navigation/i }).click();
  await page.waitForTimeout(600);
  await shoot(page, "08-mobile-nav");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  await shoot(page, "09-fullpage-mobile", { fullPage: true });
  await ctx.close();
}

// ---------- dark theme ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.evaluate(() => localStorage.setItem("writewise.theme", "dark"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await shoot(page, "10-dark");
  await ctx.close();
}

await browser.close();
console.log("done");
