import { JSDOM } from "jsdom";

export function normalizeURL(rawUrl: string) {
  const url = new URL(rawUrl);
  const normalized = `${url.host}${url.pathname}`;

  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

export function getHeadingFromHTML(html: string): string {
  try {
    const dom = new JSDOM(html);
    const heading =
      dom.window.document.querySelector("h1") ??
      dom.window.document.querySelector("h2");

    return heading?.textContent?.trim() ?? "";
  } catch {
    return "";
  }
}

export function getFirstParagraphFromHTML(html: string): string {
  try {
    const dom = new JSDOM(html);
    const main = dom.window.document.querySelector("main");
    const paragraph =
      main?.querySelector("p") ?? dom.window.document.querySelector("p");

    return paragraph?.textContent?.trim() ?? "";
  } catch {
    return "";
  }
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
  const urls: string[] = [];

  try {
    const dom = new JSDOM(html);
    const anchorElements = dom.window.document.querySelectorAll("a");

    anchorElements.forEach((anchor) => {
      const href = anchor.getAttribute("href");
      if (!href) {
        return;
      }

      try {
        const absoluteURL = new URL(href, baseURL).toString();
        urls.push(absoluteURL);
      } catch (error) {
        console.error(`invalid href '${href}':`, error);
      }
    });
  } catch (error) {
    console.error("failed to parse HTML:", error);
  }

  return urls;
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
  const imageURLs: string[] = [];

  try {
    const dom = new JSDOM(html);
    const imgElements = dom.window.document.querySelectorAll("img");

    imgElements.forEach((img) => {
      const src = img.getAttribute("src");
      if (!src) {
        return;
      }

      try {
        const absoluteURL = new URL(src, baseURL).toString();
        imageURLs.push(absoluteURL);
      } catch (error) {
        console.error(`invalid src '${src}':`, error);
      }
    });
  } catch (error) {
    console.error("failed to parse HTML:", error);
  }

  return imageURLs;
}
