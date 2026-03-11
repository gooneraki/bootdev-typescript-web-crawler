import { describe, expect, it } from "vitest";
import { normalizeURL } from "./crawl";

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
