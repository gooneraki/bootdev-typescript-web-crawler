import { JSDOM } from "jsdom";
import pLimit from "p-limit";

export type ExtractedPageData = {
  url: string;
  heading: string;
  first_paragraph: string;
  outgoing_links: string[];
  image_urls: string[];
};

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

export function extractPageData(
  html: string,
  pageURL: string,
): ExtractedPageData {
  return {
    url: pageURL,
    heading: getHeadingFromHTML(html),
    first_paragraph: getFirstParagraphFromHTML(html),
    outgoing_links: getURLsFromHTML(html, pageURL),
    image_urls: getImagesFromHTML(html, pageURL),
  };
}

export async function getHTML(url: string): Promise<string> {
  console.log(`crawling ${url}`);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": "BootCrawler/1.0",
      },
    });
  } catch (error) {
    throw new Error(`Got Network error: ${(error as Error).message}`);
  }

  if (response.status > 399) {
    console.log(`Got HTTP error: ${response.status} ${response.statusText}`);
    return "";
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("text/html")) {
    console.log(`Got non-HTML response: ${contentType}`);
    return "";
  }

  return response.text();
}

export async function crawlPage(
  baseURL: string,
  currentURL: string = baseURL,
  pages: Record<string, number> = {},
): Promise<Record<string, number>> {
  const currentURLObj = new URL(currentURL);
  const baseURLObj = new URL(baseURL);
  if (currentURLObj.hostname !== baseURLObj.hostname) {
    return pages;
  }

  const normalizedURL = normalizeURL(currentURL);

  if (pages[normalizedURL] > 0) {
    pages[normalizedURL]++;
    return pages;
  }

  pages[normalizedURL] = 1;

  console.log(`crawling ${currentURL}`);

  let html = "";
  try {
    html = (await getHTML(currentURL)) ?? "";
  } catch (error) {
    console.log(`${(error as Error).message}`);
    return pages;
  }

  const nextURLs = getURLsFromHTML(html, baseURL);
  for (const nextURL of nextURLs) {
    pages = await crawlPage(baseURL, nextURL, pages);
  }

  return pages;
}

class ConcurrentCrawler {
  private baseURL: string;
  private pages: Record<string, number>;
  private limit: <T>(fn: () => Promise<T>) => Promise<T>;
  private maxPages: number;
  private shouldStop = false;
  private allTasks = new Set<Promise<void>>();
  private visited = new Set<string>();

  constructor(
    baseURL: string,
    maxConcurrency: number = 5,
    maxPages: number = 100,
  ) {
    this.baseURL = baseURL;
    this.pages = {};
    this.limit = pLimit(maxConcurrency);
    this.maxPages = Math.max(1, maxPages);
  }

  private addPageVisit(normalizedURL: string): boolean {
    if (this.shouldStop) {
      return false;
    }

    if (this.pages[normalizedURL]) {
      this.pages[normalizedURL]++;
    } else {
      this.pages[normalizedURL] = 1;
    }

    if (this.visited.has(normalizedURL)) {
      return false;
    }

    if (this.visited.size >= this.maxPages) {
      this.shouldStop = true;
      console.log("Reached maximum number of pages to crawl.");
      return false;
    }

    this.visited.add(normalizedURL);
    return true;
  }

  private async getHTML(currentURL: string): Promise<string> {
    return await this.limit(async () => {
      let response: Response;
      try {
        response = await fetch(currentURL, {
          headers: { "User-Agent": "BootCrawler/1.0" },
        });
      } catch (error) {
        throw new Error(`Got Network error: ${(error as Error).message}`);
      }

      if (response.status > 399) {
        throw new Error(
          `Got HTTP error: ${response.status} ${response.statusText}`,
        );
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("text/html")) {
        throw new Error(`Got non-HTML response: ${contentType}`);
      }

      return response.text();
    });
  }

  private async crawlPage(currentURL: string): Promise<void> {
    if (this.shouldStop) {
      return;
    }

    const currentURLObj = new URL(currentURL);
    const baseURLObj = new URL(this.baseURL);
    if (currentURLObj.hostname !== baseURLObj.hostname) {
      return;
    }

    const normalizedURL = normalizeURL(currentURL);
    if (!this.addPageVisit(normalizedURL)) {
      return;
    }

    console.log(`crawling ${currentURL}`);

    let html = "";
    try {
      html = await this.getHTML(currentURL);
    } catch (error) {
      console.log(`${(error as Error).message}`);
      return;
    }

    if (this.shouldStop) {
      return;
    }

    const nextURLs = getURLsFromHTML(html, this.baseURL);
    const crawlPromises: Promise<void>[] = [];
    for (const nextURL of nextURLs) {
      if (this.shouldStop) {
        break;
      }

      const task = this.crawlPage(nextURL);
      this.allTasks.add(task);
      task.finally(() => this.allTasks.delete(task));
      crawlPromises.push(task);
    }

    await Promise.all(crawlPromises);
  }

  async crawl(): Promise<Record<string, number>> {
    const rootTask = this.crawlPage(this.baseURL);
    this.allTasks.add(rootTask);
    try {
      await rootTask;
    } finally {
      this.allTasks.delete(rootTask);
    }
    await Promise.allSettled(Array.from(this.allTasks));

    return this.pages;
  }
}

export async function crawlSiteAsync(
  baseURL: string,
  maxConcurrency: number = 5,
  maxPages: number = 100,
): Promise<Record<string, number>> {
  const crawler = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages);
  return await crawler.crawl();
}
