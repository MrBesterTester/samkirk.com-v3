import fs from "fs";
import AdmZip from "adm-zip";
import { expect } from "@playwright/test";

/**
 * Verify the contents of a downloaded ZIP bundle.
 *
 * Reads the ZIP file, checks that expected files exist and are non-empty,
 * validates metadata.json structure, and checks markdown files for content.
 */
export interface ZipVerifyOptions {
  /** Path to the saved ZIP file on disk */
  zipPath: string;
  /** Expected filename pattern (regex) for the download */
  filenamePattern: RegExp;
  /** Actual suggested filename from the download */
  suggestedFilename: string;
  /** Files that MUST be present in the ZIP (path within ZIP) */
  requiredFiles: string[];
  /** Glob-like prefixes — at least one file must exist under each prefix */
  requiredPrefixes?: string[];
  /** Fields that must exist in metadata.json */
  metadataFields?: string[];
  /** Patterns to look for in markdown output files (any .md under outputs/) */
  markdownPatterns?: RegExp[];
}

/**
 * Perform all ZIP content verifications.
 *
 * This function uses Playwright's expect() for assertions so failures
 * are reported clearly in test output.
 */
export function verifyZipContents(opts: ZipVerifyOptions): void {
  // 1. Verify filename matches expected pattern
  expect(opts.suggestedFilename).toMatch(opts.filenamePattern);

  // 2. Verify the file exists and is non-empty
  const stat = fs.statSync(opts.zipPath);
  expect(stat.size).toBeGreaterThan(0);

  // 3. Open the ZIP
  const zip = new AdmZip(opts.zipPath);
  const entries = zip.getEntries();
  const entryNames = entries.map((e) => e.entryName);

  // 4. Verify required files exist
  for (const required of opts.requiredFiles) {
    expect(
      entryNames,
      `ZIP should contain "${required}". Found: ${entryNames.join(", ")}`
    ).toContain(required);
  }

  // 5. Verify required prefixes (at least one file under each prefix)
  if (opts.requiredPrefixes) {
    for (const prefix of opts.requiredPrefixes) {
      const hasFile = entryNames.some((name) => name.startsWith(prefix));
      expect(
        hasFile,
        `ZIP should contain at least one file under "${prefix}". Found: ${entryNames.join(", ")}`
      ).toBe(true);
    }
  }

  // 6. Verify all required files are non-empty
  for (const required of opts.requiredFiles) {
    const entry = zip.getEntry(required);
    expect(entry, `Entry "${required}" should exist`).toBeTruthy();
    const data = entry!.getData();
    expect(
      data.length,
      `"${required}" should be non-empty`
    ).toBeGreaterThan(0);
  }

  // 7. Validate metadata.json structure
  if (opts.metadataFields && opts.metadataFields.length > 0) {
    const metadataEntry = zip.getEntry("metadata.json");
    expect(metadataEntry, "metadata.json should exist").toBeTruthy();
    const metadataText = metadataEntry!.getData().toString("utf-8");
    const metadata = JSON.parse(metadataText);

    for (const field of opts.metadataFields) {
      expect(
        metadata,
        `metadata.json should have field "${field}"`
      ).toHaveProperty(field);
    }
  }

  // 8. Check markdown output files for expected patterns
  if (opts.markdownPatterns && opts.markdownPatterns.length > 0) {
    // Find all .md files under outputs/
    const mdEntries = entries.filter(
      (e) => e.entryName.startsWith("outputs/") && e.entryName.endsWith(".md")
    );
    expect(
      mdEntries.length,
      "ZIP should contain at least one .md file under outputs/"
    ).toBeGreaterThan(0);

    // Concatenate all markdown content for pattern matching
    const allMdContent = mdEntries
      .map((e) => e.getData().toString("utf-8"))
      .join("\n");

    for (const pattern of opts.markdownPatterns) {
      expect(
        allMdContent,
        `Markdown output should match pattern ${pattern}`
      ).toMatch(pattern);
    }
  }
}
