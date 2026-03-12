import { describe, expect, it } from "vitest";
import {
  normalizeURL,
  getHeadingFromHTML,
  getFirstParagraphFromHTML,
  getURLsFromHTML,
  getImagesFromHTML,
  extractPageData,
} from "./crawl";

describe("normalizeURL", () => {
  it("strips protocol", () => {
    expect(normalizeURL("https://blog.boot.dev")).toBe("blog.boot.dev");
  });

  it("strips trailing slash", () => {
    expect(normalizeURL("https://blog.boot.dev/")).toBe("blog.boot.dev");
  });

  it("keeps path", () => {
    expect(normalizeURL("https://blog.boot.dev/path")).toBe(
      "blog.boot.dev/path",
    );
  });

  it("strips trailing slash from path", () => {
    expect(normalizeURL("https://blog.boot.dev/path/")).toBe(
      "blog.boot.dev/path",
    );
  });

  it("normalizes uppercase host", () => {
    expect(normalizeURL("https://BLOG.BOOT.DEV/path")).toBe(
      "blog.boot.dev/path",
    );
  });

  it("normalizes http and https to same value", () => {
    expect(normalizeURL("http://blog.boot.dev/path")).toBe(
      "blog.boot.dev/path",
    );
    expect(normalizeURL("https://blog.boot.dev/path")).toBe(
      "blog.boot.dev/path",
    );
  });

  it("drops query and hash", () => {
    expect(normalizeURL("https://blog.boot.dev/path?sort=asc#section")).toBe(
      "blog.boot.dev/path",
    );
  });
});

describe("getHeadingFromHTML", () => {
  it("extracts h1 content", () => {
    const html = "<html><body><h1>Title</h1></body></html>";
    expect(getHeadingFromHTML(html)).toBe("Title");
  });

  it("extracts h2 content if h1 is missing", () => {
    const html = "<html><body><h2>Subtitle</h2></body></html>";
    expect(getHeadingFromHTML(html)).toBe("Subtitle");
  });

  it("returns empty string if no h1 or h2", () => {
    const html = "<html><body><p>No headings</p></body></html>";
    expect(getHeadingFromHTML(html)).toBe("");
  });

  it("trims whitespace from heading", () => {
    const html = "<html><body><h1>   Title with spaces   </h1></body></html>";
    expect(getHeadingFromHTML(html)).toBe("Title with spaces");
  });
});

describe("getFirstParagraphFromHTML", () => {
  it("extracts first paragraph in main when present", () => {
    const html = `
      <html><body>
        <p>Outside paragraph.</p>
        <main>
          <p>Main paragraph.</p>
          <p>Main second paragraph.</p>
        </main>
      </body></html>
    `;

    expect(getFirstParagraphFromHTML(html)).toBe("Main paragraph.");
  });

  it("falls back to first paragraph outside main", () => {
    const html =
      "<html><body><p>First paragraph.</p><p>Second paragraph.</p></body></html>";
    expect(getFirstParagraphFromHTML(html)).toBe("First paragraph.");
  });

  it("returns empty string if no paragraph exists", () => {
    const html = "<html><body><h1>Heading only</h1></body></html>";
    expect(getFirstParagraphFromHTML(html)).toBe("");
  });

  it("trims whitespace in paragraph content", () => {
    const html =
      "<html><body><main><p>   Spaced paragraph   </p></main></body></html>";
    expect(getFirstParagraphFromHTML(html)).toBe("Spaced paragraph");
  });
});

describe("getURLsFromHTML", () => {
  it("getURLsFromHTML relative", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>`;

    const actual = getURLsFromHTML(inputBody, inputURL);
    const expected = ["https://crawler-test.com/path/one"];

    expect(actual).toEqual(expected);
  });

  it("getURLsFromHTML absolute", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><a href="https://example.com/path/one"><span>Boot.dev</span></a></body></html>`;

    const actual = getURLsFromHTML(inputBody, inputURL);
    const expected = ["https://example.com/path/one"];

    expect(actual).toEqual(expected);
  });

  it("getURLsFromHTML ignores anchor without href", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><a><span>Missing href</span></a></body></html>`;

    const actual = getURLsFromHTML(inputBody, inputURL);
    const expected: string[] = [];

    expect(actual).toEqual(expected);
  });
});

describe("getImagesFromHTML", () => {
  it("getImagesFromHTML relative", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><img src="/logo.png" alt="Logo"></body></html>`;

    const actual = getImagesFromHTML(inputBody, inputURL);
    const expected = ["https://crawler-test.com/logo.png"];

    expect(actual).toEqual(expected);
  });

  it("getImagesFromHTML absolute", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><img src="https://example.com/logo.png" alt="Logo"></body></html>`;

    const actual = getImagesFromHTML(inputBody, inputURL);
    const expected = ["https://example.com/logo.png"];

    expect(actual).toEqual(expected);
  });

  it("getImagesFromHTML ignores image without src", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><img alt="No source"></body></html>`;

    const actual = getImagesFromHTML(inputBody, inputURL);
    const expected: string[] = [];

    expect(actual).toEqual(expected);
  });
});

describe("extractPageData", () => {
  it("extracts basic page data", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `
      <html><body>
        <h1>Test Title</h1>
        <p>This is the first paragraph.</p>
        <a href="/link1">Link 1</a>
        <img src="/image1.jpg" alt="Image 1">
      </body></html>
    `;

    const actual = extractPageData(inputBody, inputURL);
    const expected = {
      url: "https://crawler-test.com",
      heading: "Test Title",
      first_paragraph: "This is the first paragraph.",
      outgoing_links: ["https://crawler-test.com/link1"],
      image_urls: ["https://crawler-test.com/image1.jpg"],
    };

    expect(actual).toEqual(expected);
  });

  it("prefers the first paragraph inside main", () => {
    const inputURL = "https://crawler-test.com/blog";
    const inputBody = `
      <html><body>
        <h2>Blog Post</h2>
        <p>Intro outside main.</p>
        <main>
          <p>Main paragraph.</p>
          <p>Another paragraph.</p>
        </main>
        <a href="https://example.com/about">About</a>
        <img src="hero.png" alt="Hero image">
      </body></html>
    `;

    expect(extractPageData(inputBody, inputURL)).toEqual({
      url: "https://crawler-test.com/blog",
      heading: "Blog Post",
      first_paragraph: "Main paragraph.",
      outgoing_links: ["https://example.com/about"],
      image_urls: ["https://crawler-test.com/hero.png"],
    });
  });

  it("returns empty values when elements are missing", () => {
    const inputURL = "https://crawler-test.com/empty";
    const inputBody =
      "<html><body><div>No extractable content</div></body></html>";

    expect(extractPageData(inputBody, inputURL)).toEqual({
      url: "https://crawler-test.com/empty",
      heading: "",
      first_paragraph: "",
      outgoing_links: [],
      image_urls: [],
    });
  });
});
