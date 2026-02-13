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
import { readFileSync, existsSync, readdirSync, statSync } from "fs";

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

/**
 * Find an archive directory by partial timestamp prefix.
 * E.g. "2026-02-09" matches the first dir starting with that prefix.
 * Exits with error if no match or ambiguous (multiple matches).
 */
function findArchiveByPrefix(prefix: string): string {
  const archiveDir = getArchiveDir();

  if (!existsSync(archiveDir)) {
    log("No test run archives found", false);
    process.exit(1);
  }

  const entries = readdirSync(archiveDir, { withFileTypes: true });
  const matches = entries
    .filter((e) => e.isDirectory() && e.name.startsWith(prefix))
    .map((e) => e.name)
    .sort();

  if (matches.length === 0) {
    log(`No archive matches prefix "${prefix}"`, false);
    process.exit(1);
  }

  if (matches.length > 1) {
    log(
      `Ambiguous prefix "${prefix}" — matches ${matches.length} archives:`,
      false,
    );
    for (const m of matches) {
      console.log(`  ${m}`);
    }
    process.exit(1);
  }

  return matches[0];
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
// Test Index Parsing
// ============================================================================

/** A row from the Test Index section */
interface TestIndexRow {
  path: string;
  describes: string;
}

/**
 * Parse the ## Test Index section from summary.md content.
 * Returns an empty array if the section doesn't exist.
 */
function parseTestIndex(content: string): TestIndexRow[] {
  const rows: TestIndexRow[] = [];

  const section = content.match(
    /## Test Index\s*\n([\s\S]*?)(?=\n## |\n*$)/,
  );
  if (!section) return rows;

  const lines = section[1].split("\n");

  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    if (line.includes("---")) continue;
    if (line.includes("File") && line.includes("Describe")) continue;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

    if (cells.length >= 2) {
      rows.push({ path: cells[0], describes: cells[1] });
    }
  }

  return rows;
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

/** Print the test index section (used with --full) */
function printTestIndex(testIndex: TestIndexRow[]): void {
  console.log("");
  console.log(
    colorize("  TEST INDEX", ANSI.cyan + ANSI.bold),
  );
  console.log(`  ${THIN_SEP}`);

  if (testIndex.length === 0) {
    console.log("    No test files found.");
  } else {
    const COL_PATH = 45;
    console.log(
      "  " + padRight("File", COL_PATH) + "Describe Blocks",
    );
    console.log(`  ${THIN_SEP}`);
    for (const row of testIndex) {
      console.log(
        "  " + padRight(row.path, COL_PATH) + row.describes,
      );
    }
  }

  console.log("");
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
// Fixtures View
// ============================================================================

/** Known fixture → generating test suite mappings */
const FIXTURE_GENERATORS: Record<string, string> = {
  "interview-chat/e2e-real-llm-transcript.md": "E2E Real LLM",
  "interview-chat/e2e-downloaded-bundle.zip": "E2E Tests",
  "interview-chat/e2e-test-output.txt": "E2E Tests",
  "interview-chat/smoke-test-output.txt": "Smoke Tests",
  "interview-chat/conversation-transcript.md": "Unit Tests",
  "resume-generator/e2e-generated-resume.md": "E2E Real LLM",
  "resume-generator/e2e-generated-resume.json": "E2E Real LLM",
  "resume-generator/generated-resume.md": "Unit Tests",
  "resume-generator/generated-resume.html": "Unit Tests",
  "fit-report/extracted-fields.json": "Unit Tests",
  "fit-report/llm-response.json": "Unit Tests",
  "fit-report/generated-report.md": "Unit Tests",
};

/** Input fixtures (not generated by tests) */
const INPUT_FIXTURES = new Set([
  "interview-chat/resume-chunks.json",
  "interview-chat/test-questions.json",
  "resume-generator/resume-chunks.json",
  "resume-generator/job-description.txt",
  "fit-report/resume-chunks.json",
  "fit-report/job-description.txt",
]);

interface FixtureFile {
  relativePath: string;
  mtime: Date;
  generator: string;
}

/** Recursively collect fixture files with mtime and generator attribution */
function collectFixtures(dir: string, prefix: string): FixtureFile[] {
  const files: FixtureFile[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...collectFixtures(resolve(dir, entry.name), relPath));
    } else {
      if (entry.name === "README.md") continue;
      const stat = statSync(resolve(dir, entry.name));
      let generator = FIXTURE_GENERATORS[relPath] ?? "";
      if (INPUT_FIXTURES.has(relPath)) generator = "(input)";
      if (!generator) generator = "(unknown)";
      files.push({ relativePath: relPath, mtime: stat.mtime, generator });
    }
  }

  return files;
}

/** Print the fixture inventory view */
function printFixturesView(): void {
  const fixturesDir = resolve(__dirname, "../test-fixtures");

  if (!existsSync(fixturesDir)) {
    log("No test-fixtures directory found at web/test-fixtures/", false);
    process.exit(1);
  }

  const files = collectFixtures(fixturesDir, "");
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  console.log("");
  console.log(SEPARATOR);
  console.log(`  FIXTURE INVENTORY (${files.length} files)`);
  console.log(SEPARATOR);
  console.log("");

  const COL_FILE = 45;
  const COL_MTIME = 22;

  console.log(
    "  " +
      padRight("File", COL_FILE) +
      padRight("Modified", COL_MTIME) +
      "Generator",
  );
  console.log(`  ${THIN_SEP}`);

  let currentDir = "";
  for (const file of files) {
    const dir = file.relativePath.split("/")[0];
    if (dir !== currentDir) {
      if (currentDir) console.log("");
      currentDir = dir;
    }

    const mtimeStr = file.mtime
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
    const genColor =
      file.generator === "(input)"
        ? ANSI.dim
        : file.generator === "(unknown)"
          ? ANSI.yellow
          : ANSI.cyan;

    console.log(
      "  " +
        padRight(file.relativePath, COL_FILE) +
        padRight(mtimeStr, COL_MTIME) +
        colorize(file.generator, genColor),
    );
  }

  console.log("");
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
    const archiveRoot = getArchiveDir();
    const dirName =
      args.run !== null ? findArchiveByPrefix(args.run) : findLatestArchive();

    if (!dirName) {
      log("No test run archives found", false);
      process.exit(1);
    }

    const logPath = resolve(archiveRoot, dirName, `${args.log}.log`);

    if (!existsSync(logPath)) {
      log(
        `No log file found for suite "${args.log}" in ${dirName}`,
        false,
      );
      const dirPath = resolve(archiveRoot, dirName);
      const available = readdirSync(dirPath)
        .filter((f) => f.endsWith(".log"))
        .map((f) => f.replace(".log", ""));
      if (available.length > 0) {
        console.log(`  Available suites: ${available.join(", ")}`);
      }
      process.exit(1);
    }

    const logContent = readFileSync(logPath, "utf-8");
    console.log(logContent);
    process.exit(0);
  }
  // --full is handled below alongside default view
  if (args.fixtures) {
    printFixturesView();
    console.log("");
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
  const archiveDirName =
    args.run !== null ? findArchiveByPrefix(args.run) : findLatestArchive();

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

  // --full: append test index section
  if (args.full) {
    const testIndex = parseTestIndex(content);
    printTestIndex(testIndex);
  }

  console.log("");
}

main();
