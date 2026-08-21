import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
await page.goto("http://127.0.0.1:3132/");
await page.waitForTimeout(800);

const out = await page.evaluate(async () => {
  const el = document.querySelector("[data-reveal]");
  const results = {};
  results.inlineStyle = el.getAttribute("style");
  results.parentTag = el.parentElement?.tagName;

  // Can WAAPI (what motion drives) interpolate these exact keyframes?
  const probe = document.createElement("div");
  probe.style.cssText = "width:100px;height:20px;background:red";
  document.body.appendChild(probe);
  try {
    const a = probe.animate(
      [{ clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)" }],
      { duration: 100, fill: "forwards" },
    );
    await a.finished;
    results.waapiClipPath = getComputedStyle(probe).clipPath;
  } catch (e) {
    results.waapiClipPath = "THREW: " + e.message;
  }
  probe.remove();
  return results;
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
