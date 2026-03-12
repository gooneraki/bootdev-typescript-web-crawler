import { JSDOM } from "jsdom";

export function normalizeURL(rawUrl: string) {
  const url = new URL(rawUrl);
  const normalized = `${url.hostname}${url.pathname}`.toLowerCase();

  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

export function getHeadingFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const heading =
    dom.window.document.querySelector("h1") ??
    dom.window.document.querySelector("h2");

  return heading?.textContent?.trim() ?? "";
}

export function getFirstParagraphFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const main = dom.window.document.querySelector("main");
  const paragraph =
    main?.querySelector("p") ?? dom.window.document.querySelector("p");

  return paragraph?.textContent?.trim() ?? "";
}
