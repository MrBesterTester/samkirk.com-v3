/**
 * Test results viewer — reads the latest test run archive and prints
 * a formatted summary to the terminal.
 *
 * Run with: cd web && npx tsx scripts/test-results.ts
 *
 * Flags (parsed now, implemented in later phases):
 *   --list              List all archived test runs
 *   --run <dir>         View a specific run by directory name
 *   --full              Show full details (all sections)
 *   --log <suite>       Print raw log for a suite
 *   --fixtures          Show fixture snapshot inventory
 *   --diff <dir1> <dir2>  Compare two runs
 *   --json              Output as JSON
 */

import { resolve } from "path";
import { readFileSync, existsSync, readdirSync } from "fs";

// ============================================================================
// ANSI Colors
// ============================================================================

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
} as const;

function colorize(text: string, color: string): string {
  return `${color}${text}${ANSI.reset}`;
}

// ============================================================================
// Logging (matches project convention: -> info, checkmark success, x failure)
// ============================================================================

function log(message: string, success?: boolean): void {
  const prefix =
    success === true ? "\u2713" : success === false ? "\u2717" : "\u2192";
  console.log(`${prefix} ${message}`);
}

// ============================================================================
// Types
// ============================================================================

/** Parsed YAML frontmatter from summary.md */
interface SummaryFrontmatter {
  timestamp: string;
  suites_run: string[];
  overall: string;
  gcp_available: boolean;
  triggered_by: string | null;
  release_candidate: boolean;
}

/** A single row from the summary table */
interface SuiteRow {
  name: string;
  status: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: string;
}

/** A fixture update entry (Phase 2 — currently unused) */
interface FixtureUpdate {
  file: string;
  action: string;
}

/** Parsed CLI arguments */
interface ViewerArgs {
  list: boolean;
  run: string | null;
  full: boolean;
  log: string | null;
  fixtures: boolean;
  diff: [string, string] | null;
  json: boolean;
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs(): ViewerArgs {
  const argv = process.argv.slice(2);

  function hasFlag(flag: string): boolean {
    return argv.includes(flag);
  }

  function getFlagValue(flag: string): string | null {
    const idx = argv.indexOf(flag);
    if (idx === -1 || idx + 1 >= argv.length) return null;
    return argv[idx + 1];
  }

  function getDiffArgs(): [string, string] | null {
    const idx = argv.indexOf("--diff");
    if (idx === -1 || idx + 2 >= argv.length) return null;
    return [argv[idx + 1], argv[idx + 2]];
  }

  return {
    list: hasFlag("--list"),
    run: getFlagValue("--run"),
    full: hasFlag("--full"),
    log: getFlagValue("--log"),
    fixtures: hasFlag("--fixtures"),
    diff: getDiffArgs(),
    json: hasFlag("--json"),
  };
}

// ============================================================================
// Table Formatting
// ============================================================================

const COL_NAME = 20;
const COL_STATUS = 10;
const COL_PASS = 8;
const COL_FAIL = 8;
const COL_SKIP = 8;
const COL_TIME = 10;
const SEPARATOR = "===================================================================";
const THIN_SEP = "\u2500".repeat(65);

function padRight(str: string, width: number): string {
  return str + " ".repeat(Math.max(0, width - str.length));
}

function padLeft(str: string, width: number): string {
  return " ".repeat(Math.max(0, width - str.length)) + str;
}

// ============================================================================
// Archive Discovery
// ============================================================================

/** Resolve the archive root directory */
function getArchiveDir(): string {
  return resolve(__dirname, "../../do-work/archive/test-runs");
}

/**
 * Find the latest archive directory by sorting lexicographically.
 * Returns the directory name (e.g. "2026-02-09_17-03-27") or null if none found.
 */
function findLatestArchive(): string | null {
  const archiveDir = getArchiveDir();

  if (!existsSync(archiveDir)) {
    return null;
  }

  const entries = readdirSync(archiveDir, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  if (dirs.length === 0) {
    return null;
  }

  // Last entry when sorted lexicographically is the latest
  return dirs[dirs.length - 1];
}

// ============================================================================
// Frontmatter Parsing
// ============================================================================

/**
 * Parse YAML frontmatter from summary.md content using regex.
 * Returns null if frontmatter is missing or malformed.
 */
function parseSummaryFrontmatter(content: string): SummaryFrontmatter | null {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  const yaml = fmMatch[1];

  // Extract individual fields with regex
  const timestampMatch = yaml.match(/^timestamp:\s*(.+)$/m);
  const suitesRunMatch = yaml.match(/^suites_run:\s*\[([^\]]*)\]$/m);
  const overallMatch = yaml.match(/^overall:\s*(.+)$/m);
  const gcpMatch = yaml.match(/^gcp_available:\s*(.+)$/m);
  const triggeredByMatch = yaml.match(/^triggered_by:\s*(.+)$/m);
  const releaseCandidateMatch = yaml.match(/^release_candidate:\s*(.+)$/m);

  if (!timestampMatch || !overallMatch) return null;

  const suitesRaw = suitesRunMatch ? suitesRunMatch[1].trim() : "";
  const suitesRun = suitesRaw
    ? suitesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    timestamp: timestampMatch[1].trim(),
    suites_run: suitesRun,
    overall: overallMatch[1].trim(),
    gcp_available: gcpMatch ? gcpMatch[1].trim() === "true" : false,
    triggered_by: triggeredByMatch ? triggeredByMatch[1].trim() : null,
    release_candidate: releaseCandidateMatch
      ? releaseCandidateMatch[1].trim() === "true"
      : false,
  };
}

// ============================================================================
// Summary Table Parsing
// ============================================================================

/**
 * Parse the markdown summary table from summary.md content.
 * Extracts suite rows with name, status, passed, failed, skipped, duration.
 */
function parseSummaryTable(content: string): SuiteRow[] {
  const rows: SuiteRow[] = [];

  // Find the ## Summary section and its table
  const summarySection = content.match(/## Summary\s*\n([\s\S]*?)(?=\n## |\n*$)/);
  if (!summarySection) return rows;

  const lines = summarySection[1].split("\n");

  for (const line of lines) {
    // Match table data rows: | Name | STATUS | N | N | N | Xs |
    // Skip header and separator rows
    if (!line.startsWith("|")) continue;
    if (line.includes("---")) continue;
    if (line.includes("Suite") && line.includes("Status")) continue;
    // Skip totals row
    if (line.includes("**Total**")) continue;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

    if (cells.length < 6) continue;

    rows.push({
      name: cells[0],
      status: cells[1],
      passed: parseInt(cells[2], 10) || 0,
      failed: parseInt(cells[3], 10) || 0,
      skipped: parseInt(cells[4], 10) || 0,
      duration: cells[5],
    });
  }

  return rows;
}

// ============================================================================
// Fixture Updates Parsing (Phase 2 — graceful empty return)
// ============================================================================

/**
 * Parse the Fixture Updates section from summary.md content.
 * Returns an empty array if the section doesn't exist.
 */
function parseFixtureUpdates(content: string): FixtureUpdate[] {
  const updates: FixtureUpdate[] = [];

  const fixtureSection = content.match(
    /## Fixture Updates\s*\n([\s\S]*?)(?=\n## |\n*$)/,
  );
  if (!fixtureSection) return updates;

  const lines = fixtureSection[1].split("\n");

  for (const line of lines) {
    // Expected format: "- <action>: <file>" or similar
    const match = line.match(/^-\s+(\w+):\s+(.+)$/);
    if (match) {
      updates.push({
        action: match[1],
        file: match[2].trim(),
      });
    }
  }

  return updates;
}

// ============================================================================
// Timestamp Formatting
// ============================================================================

/**
 * Format an ISO timestamp string to a human-readable display string.
 * E.g. "2026-02-09T17:03:27-08:00" -> "2026-02-09 17:03:27 PST"
 */
function formatTimestamp(iso: string): string {
  // Extract date and time parts from ISO format
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
  if (!match) return iso;
  return `${match[1]} ${match[2]} PST`;
}

// ============================================================================
// Output Rendering
// ============================================================================

/** Print the formatted default view */
function printDefaultView(
  frontmatter: SummaryFrontmatter,
  suiteRows: SuiteRow[],
  fixtureUpdates: FixtureUpdate[],
  archiveDirName: string,
): void {
  const displayTimestamp = formatTimestamp(frontmatter.timestamp);
  const overallColor =
    frontmatter.overall === "pass" ? ANSI.green : ANSI.red;

  // Header
  console.log(SEPARATOR);
  console.log(
    `  LAST TEST RUN: ${displayTimestamp}    Overall: ${colorize(frontmatter.overall.toUpperCase(), overallColor + ANSI.bold)}`,
  );
  console.log(SEPARATOR);
  console.log("");

  // Table header
  const headerLine =
    "  " +
    padRight("Suite", COL_NAME) +
    padRight("Status", COL_STATUS) +
    padLeft("Passed", COL_PASS) +
    padLeft("Failed", COL_FAIL) +
    padLeft("Skipped", COL_SKIP) +
    padLeft("Duration", COL_TIME);
  console.log(headerLine);
  console.log(`  ${THIN_SEP}`);

  // Table rows
  for (const row of suiteRows) {
    const statusColor =
      row.status === "PASSED"
        ? ANSI.green
        : row.status === "FAILED"
          ? ANSI.red
          : ANSI.yellow;

    const line =
      "  " +
      padRight(row.name, COL_NAME) +
      colorize(padRight(row.status, COL_STATUS), statusColor) +
      colorize(padLeft(String(row.passed), COL_PASS), ANSI.green) +
      colorize(
        padLeft(String(row.failed), COL_FAIL),
        row.failed > 0 ? ANSI.red : ANSI.dim,
      ) +
      colorize(
        padLeft(String(row.skipped), COL_SKIP),
        row.skipped > 0 ? ANSI.yellow : ANSI.dim,
      ) +
      padLeft(row.duration, COL_TIME);

    console.log(line);
  }

  console.log("");

  // Fixture updates
  console.log("  Fixtures Updated:");
  if (fixtureUpdates.length === 0) {
    console.log("    (none in this run)");
  } else {
    for (const update of fixtureUpdates) {
      console.log(`    ${update.action}: ${update.file}`);
    }
  }

  console.log("");

  // Archive path (relative from project root)
  console.log(
    `  Archive: do-work/archive/test-runs/${archiveDirName}/`,
  );
  console.log(SEPARATOR);
}

// ============================================================================
// List View
// ============================================================================

/** Print a reverse-chronological table of all archived test runs */
function printListView(): void {
  const archiveDir = getArchiveDir();

  if (!existsSync(archiveDir)) {
    log("No test run archives found in do-work/archive/test-runs/", false);
    process.exit(1);
  }

  const entries = readdirSync(archiveDir, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .reverse(); // newest first

  if (dirs.length === 0) {
    log("No test run archives found in do-work/archive/test-runs/", false);
    process.exit(1);
  }

  // Collect parsed runs, skipping any with missing/unparseable summaries
  const runs: { dirName: string; frontmatter: SummaryFrontmatter }[] = [];
  for (const dirName of dirs) {
    const summaryPath = resolve(archiveDir, dirName, "summary.md");
    if (!existsSync(summaryPath)) continue;
    try {
      const content = readFileSync(summaryPath, "utf-8");
      const fm = parseSummaryFrontmatter(content);
      if (fm) runs.push({ dirName, frontmatter: fm });
    } catch {
      // skip unparseable archives
    }
  }

  if (runs.length === 0) {
    log("No parseable test run summaries found", false);
    process.exit(1);
  }

  // Column widths
  const COL_TS = 26;
  const COL_OVERALL = 9;

  console.log(SEPARATOR);
  console.log(
    `  ARCHIVED TEST RUNS (${runs.length} found)`,
  );
  console.log(SEPARATOR);
  console.log("");

  // Header
  console.log(
    "  " +
      padRight("Timestamp", COL_TS) +
      padRight("Overall", COL_OVERALL) +
      "Suites",
  );
  console.log(`  ${THIN_SEP}`);

  // Rows
  for (const { frontmatter } of runs) {
    const displayTs = formatTimestamp(frontmatter.timestamp);
    const overallUpper = frontmatter.overall.toUpperCase();
    const overallColor =
      frontmatter.overall === "pass" ? ANSI.green : ANSI.red;
    const suitesStr = frontmatter.suites_run.join(", ");

    console.log(
      "  " +
        padRight(displayTs, COL_TS) +
        colorize(padRight(overallUpper, COL_OVERALL), overallColor + ANSI.bold) +
        suitesStr,
    );
  }

  console.log(SEPARATOR);
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const args = parseArgs();

  // Handle --list flag
  if (args.list) {
    console.log("");
    printListView();
    console.log("");
    process.exit(0);
  }
  if (args.log !== null) {
    log("--log flag not implemented yet");
    process.exit(0);
  }
  if (args.full) {
    log("--full flag not implemented yet");
    process.exit(0);
  }
  if (args.fixtures) {
    log("--fixtures flag not implemented yet");
    process.exit(0);
  }
  if (args.diff !== null) {
    log("--diff flag not implemented yet");
    process.exit(0);
  }
  if (args.json) {
    log("--json flag not implemented yet");
    process.exit(0);
  }

  // Determine which archive to display
  const archiveDirName = args.run ?? findLatestArchive();

  if (!archiveDirName) {
    log("No test run archives found in do-work/archive/test-runs/", false);
    process.exit(1);
  }

  // Read summary.md
  const archiveDir = getArchiveDir();
  const summaryPath = resolve(archiveDir, archiveDirName, "summary.md");

  if (!existsSync(summaryPath)) {
    log(`summary.md not found in archive: ${archiveDirName}`, false);
    process.exit(1);
  }

  const content = readFileSync(summaryPath, "utf-8");

  // Parse frontmatter
  const frontmatter = parseSummaryFrontmatter(content);
  if (!frontmatter) {
    log(`Failed to parse frontmatter in ${archiveDirName}/summary.md`, false);
    process.exit(1);
  }

  // Parse summary table
  const suiteRows = parseSummaryTable(content);
  if (suiteRows.length === 0) {
    log(
      `No suite results found in summary table for ${archiveDirName}`,
      false,
    );
    process.exit(1);
  }

  // Parse fixture updates (graceful — empty if section missing)
  const fixtureUpdates = parseFixtureUpdates(content);

  // Print formatted output
  console.log("");
  printDefaultView(frontmatter, suiteRows, fixtureUpdates, archiveDirName);
  console.log("");
}

main();
