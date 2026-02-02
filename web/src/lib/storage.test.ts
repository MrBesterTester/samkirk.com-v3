import { describe, it, expect, vi } from "vitest";
import { PrivatePaths, PublicPaths } from "./storage";

// Mock the server-only module to allow testing
vi.mock("server-only", () => ({}));

// Mock the env module
vi.mock("./env", () => ({
  getEnv: () => ({
    GCP_PROJECT_ID: "test-project",
    GCS_PUBLIC_BUCKET: "test-public-bucket",
    GCS_PRIVATE_BUCKET: "test-private-bucket",
    VERTEX_AI_LOCATION: "us-central1",
    VERTEX_AI_MODEL: "gemini-pro",
    RECAPTCHA_SITE_KEY: "test-site-key",
    RECAPTCHA_SECRET_KEY: "test-secret-key",
    GOOGLE_OAUTH_CLIENT_ID: "test-client-id",
    GOOGLE_OAUTH_CLIENT_SECRET: "test-client-secret",
  }),
}));

describe("storage path helpers", () => {
  describe("PrivatePaths", () => {
    describe("masterResume", () => {
      it("returns the fixed path for master resume", () => {
        expect(PrivatePaths.masterResume()).toBe("resume/master.md");
      });
    });

    describe("resumeIndex", () => {
      it("returns the fixed path for resume index JSON", () => {
        expect(PrivatePaths.resumeIndex()).toBe("resume/index/current.json");
      });
    });

    describe("submissionPrefix", () => {
      it("builds correct prefix for submission artifacts", () => {
        expect(PrivatePaths.submissionPrefix("sub-123")).toBe(
          "submissions/sub-123/"
        );
        expect(PrivatePaths.submissionPrefix("uuid-abc-def")).toBe(
          "submissions/uuid-abc-def/"
        );
      });
    });

    describe("submissionInput", () => {
      it("builds correct path for submission input files", () => {
        expect(PrivatePaths.submissionInput("sub-123", "job.txt")).toBe(
          "submissions/sub-123/input/job.txt"
        );
        expect(PrivatePaths.submissionInput("sub-456", "posting.pdf")).toBe(
          "submissions/sub-456/input/posting.pdf"
        );
      });
    });

    describe("submissionExtracted", () => {
      it("builds correct path for extracted data JSON", () => {
        expect(PrivatePaths.submissionExtracted("sub-123")).toBe(
          "submissions/sub-123/extracted.json"
        );
      });
    });

    describe("submissionOutput", () => {
      it("builds correct path for submission output files", () => {
        expect(PrivatePaths.submissionOutput("sub-123", "report.md")).toBe(
          "submissions/sub-123/output/report.md"
        );
        expect(PrivatePaths.submissionOutput("sub-123", "resume.html")).toBe(
          "submissions/sub-123/output/resume.html"
        );
        expect(PrivatePaths.submissionOutput("sub-456", "transcript.md")).toBe(
          "submissions/sub-456/output/transcript.md"
        );
      });
    });

    describe("submissionBundle", () => {
      it("builds correct path for submission bundle zip", () => {
        expect(PrivatePaths.submissionBundle("sub-123")).toBe(
          "submissions/sub-123/bundle.zip"
        );
      });
    });
  });

  describe("PublicPaths", () => {
    describe("danceMenuCurrent", () => {
      it("returns the fixed prefix for current Dance Menu", () => {
        expect(PublicPaths.danceMenuCurrent()).toBe("dance-menu/current/");
      });
    });

    describe("danceMenuFile", () => {
      it("builds correct path for Dance Menu files", () => {
        expect(PublicPaths.danceMenuFile("menu.html")).toBe(
          "dance-menu/current/menu.html"
        );
        expect(PublicPaths.danceMenuFile("menu.md")).toBe(
          "dance-menu/current/menu.md"
        );
        expect(PublicPaths.danceMenuFile("menu.txt")).toBe(
          "dance-menu/current/menu.txt"
        );
        expect(PublicPaths.danceMenuFile("menu.pdf")).toBe(
          "dance-menu/current/menu.pdf"
        );
      });
    });

    describe("danceMenuVersioned", () => {
      it("builds correct prefix for versioned Dance Menu", () => {
        expect(PublicPaths.danceMenuVersioned("2026-02-02")).toBe(
          "dance-menu/2026-02-02/"
        );
        expect(PublicPaths.danceMenuVersioned("v1")).toBe("dance-menu/v1/");
      });
    });
  });
});
