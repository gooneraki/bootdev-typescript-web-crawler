import { describe, expect, it } from "vitest";
import {
  normalizeURL,
  getHeadingFromHTML,
  getFirstParagraphFromHTML,
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
