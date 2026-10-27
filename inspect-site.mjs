
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const TARGET_URL =
  "https://ayisha-shahidrizwan.vercel.app/";

const OUT = path.resolve("inspection-output");

await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});

const failedRequests = [];

page.on("requestfailed", (request) => {
  failedRequests.push({
    url: request.url(),
    error: request.failure()?.errorText,
  });
});

try {
  await page.goto(TARGET_URL, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
} catch {
  console.log(
    "Network idle timed out; continuing with loaded content."
  );

  if (!page.url().startsWith("http")) {
    throw new Error("The reference page could not be opened.");
  }
}

await page.waitForTimeout(2500);

// Capture the page as a visitor sees it.
await page.screenshot({
  path: path.join(OUT, "desktop-full.png"),
  fullPage: true,
  animations: "disabled",
});

const desktop = await page.evaluate(() => {
  const clean = (value) =>
    value?.replace(/\s+/g, " ").trim();

  const describeElement = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();

    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      className:
        typeof el.className === "string"
          ? el.className.slice(0, 250)
          : null,
      text: clean(el.innerText)?.slice(0, 700),
      rect: {
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height),
      },
      styles: {
        display: s.display,
        position: s.position,
        backgroundColor: s.backgroundColor,
        color: s.color,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        textTransform: s.textTransform,
        borderRadius: s.borderRadius,
        boxShadow: s.boxShadow,
        margin: s.margin,
        padding: s.padding,
        backgroundImage: s.backgroundImage,
        animationName: s.animationName,
        animationDuration: s.animationDuration,
        transition: s.transition,
      },
    };
  };

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);

    return (
      r.width > 0 &&
      r.height > 0 &&
      s.display !== "none" &&
      s.visibility !== "hidden"
    );
  };

  const elements = (selector) =>
    [...document.querySelectorAll(selector)]
      .filter(visible)
      .map(describeElement);

  const sections = [
    ...document.querySelectorAll(
      "header, nav, main, section, footer, article, [role='main']"
    ),
  ].filter(visible);

  const images = [
    ...document.images,
  ].map((img) => ({
    src: img.currentSrc || img.src,
    alt: img.alt,
    width: img.naturalWidth,
    height: img.naturalHeight,
    loading: img.loading,
  }));

  const backgrounds = [
    ...document.querySelectorAll("*"),
  ]
    .filter(visible)
    .map((el) => ({
      element: el.tagName.toLowerCase(),
      className:
        typeof el.className === "string"
          ? el.className.slice(0, 150)
          : "",
      background: getComputedStyle(el).backgroundImage,
    }))
    .filter((x) => x.background !== "none");

  const links = [...document.querySelectorAll("a")]
    .map((a) => ({
      text: clean(a.innerText),
      href: a.href,
      target: a.target,
    }));

  const forms = [...document.querySelectorAll("form")]
    .map((form) => ({
      action: form.action,
      method: form.method,
      fields: [...form.querySelectorAll(
        "input, textarea, select, button"
      )].map((el) => ({
        tag: el.tagName.toLowerCase(),
        type: el.type || null,
        name: el.name || null,
        placeholder: el.placeholder || null,
        text: clean(el.innerText),
      })),
    }));

  const animations = document.getAnimations().map((a) => ({
    playState: a.playState,
    currentTime: a.currentTime,
    timing: a.effect?.getTiming(),
    target:
      a.effect?.target?.tagName?.toLowerCase() || null,
  }));

  return {
    url: location.href,
    title: document.title,
    description:
      document.querySelector(
        'meta[name="description"]'
      )?.content || null,
    viewport: {
      width: innerWidth,
      height: innerHeight,
      documentHeight: document.documentElement.scrollHeight,
    },
    fonts: [
      ...new Set(
        [...document.querySelectorAll("*")]
          .filter(visible)
          .map((el) => getComputedStyle(el).fontFamily)
      ),
    ],
    sections: sections.map(describeElement),
    headings: elements("h1, h2, h3, h4"),
    buttons: elements("button, [role='button']"),
    images,
    backgroundImages: backgrounds,
    links,
    forms,
    animations,
    stylesheetUrls: [
      ...document.styleSheets,
    ].map((s) => s.href).filter(Boolean),
    resourceUrls: performance
      .getEntriesByType("resource")
      .map((r) => r.name)
      .filter((url) =>
        /\.(css|woff2?|ttf|otf|png|jpe?g|webp|svg|gif|mp4)(\?|$)/i
          .test(url)
      ),
    html: document.documentElement.outerHTML,
  };
});

await fs.writeFile(
  path.join(OUT, "desktop-report.json"),
  JSON.stringify(desktop, null, 2)
);

// Mobile viewport inspection.
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});

await mobile.goto(TARGET_URL, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});

await mobile.waitForTimeout(2000);

await mobile.screenshot({
  path: path.join(OUT, "mobile-full.png"),
  fullPage: true,
  animations: "disabled",
});

await mobile.screenshot({
  path: path.join(OUT, "mobile-first-screen.png"),
  fullPage: false,
  animations: "disabled",
});

await fs.writeFile(
  path.join(OUT, "page.html"),
  desktop.html
);

delete desktop.html;

await fs.writeFile(
  path.join(OUT, "desktop-report.json"),
  JSON.stringify(desktop, null, 2)
);

await fs.writeFile(
  path.join(OUT, "failed-requests.json"),
  JSON.stringify(failedRequests, null, 2)
);

await mobile.close();
await browser.close();

console.log("Inspection complete.");
console.log(`Output folder: ${OUT}`);
console.log(
  "Review desktop-full.png, mobile-full.png, " +
  "desktop-report.json and page.html."
);

