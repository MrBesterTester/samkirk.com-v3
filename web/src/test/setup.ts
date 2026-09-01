import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock server-only module for testing
vi.mock("server-only", () => ({}));

// jsdom does not implement Blob.prototype.text() / .arrayBuffer(), which real
// browsers have supported since 2019 (verified in Chromium against this app).
// Without these, any code reading a File resolves to nothing under test and a
// passing test would prove only that the read failed. FileReader *is*
// implemented, so back the polyfills with it.
if (typeof Blob !== "undefined" && typeof Blob.prototype.text !== "function") {
  Blob.prototype.text = function text(this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

if (typeof Blob !== "undefined" && typeof Blob.prototype.arrayBuffer !== "function") {
  Blob.prototype.arrayBuffer = function arrayBuffer(this: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

// Cleanup after each test to prevent DOM pollution
afterEach(() => {
  cleanup();
});
