import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock server-only module for testing
vi.mock("server-only", () => ({}));

// Cleanup after each test to prevent DOM pollution
afterEach(() => {
  cleanup();
});
