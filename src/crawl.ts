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

export function getURLsFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const anchorElements = dom.window.document.querySelectorAll("a");
  const urls: string[] = [];

  anchorElements.forEach((anchor) => {
    const href = anchor.getAttribute("href");
    if (href) {
      if (href.startsWith("http")) {
        urls.push(href);
      } else {
        try {
          const absoluteURL = new URL(href, baseURL).href;
          urls.push(absoluteURL);
        } catch (error) {
          // Ignore invalid URLs
        }
      }
    }
  });

  return urls;
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const imgElements = dom.window.document.querySelectorAll("img");
  const imageURLs: string[] = [];

  imgElements.forEach((img) => {
    const src = img.getAttribute("src");
    if (src) {
      if (src.startsWith("http")) {
        imageURLs.push(src);
      } else {
        try {
          const absoluteURL = new URL(src, baseURL).href;
          imageURLs.push(absoluteURL);
        } catch (error) {
          // Ignore invalid URLs
        }
      }
    }
  });

  return imageURLs;
}
