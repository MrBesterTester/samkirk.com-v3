/**
 * Master test runner that orchestrates all test suites.
 *
 * Run with: cd web && npx tsx scripts/test-all.ts
 *           or: npm run test:all
 *
 * Examples:
 *   npm run test:all                          # All suites, auto-detect GCP
 *   npm run test:all -- --unit                # Unit tests only
 *   npm run test:all -- --e2e                 # Playwright E2E only
 *   npm run test:all -- --e2e-real            # Real LLM E2E (requires GCP)
 *   npm run test:all -- --smoke               # GCP smoke tests only
 *   npm run test:all -- --no-gcp              # Skip GCP-dependent suites
 *   npm run test:all -- --gcp                 # Force-include GCP (fail if bad)
 *   npm run test:all -- --headed              # Playwright headed mode (see browser)
 *   npm run test:all -- --interactive         # Playwright UI mode
 *   npm run test:all -- --verbose             # Stream child stdout in real time
 *   npm run test:all -- --release             # Release-qualifying run
 *   npm run test:all -- --ref UR-001/REQ-042  # Cross-link to work unit
 *   npm run test:all -- --no-archive          # Skip archive writing
 *
 * Prerequisites:
 * - For GCP suites: GCP credentials + web/.env.local with GCP_PROJECT_ID, GCS_PUBLIC_BUCKET
 * - For E2E Real LLM: Seeded resume data (npm run seed:resume)
 */

import { spawn, execSync, type ChildProcess } from "child_process";
import { resolve, relative } from "path";
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from "fs";
import { config } from "dotenv";

// Load .env.local from the web directory (before any GCP checks)
config({ path: resolve(__dirname, "../.env.local") });

// ============================================================================
// Types
// ============================================================================

/** A test suite definition */
interface Suite {
  /** Human-readable suite name */
  name: string;
  /** Command to execute (resolved relative to web/) */
  command: string;
  /** Arguments to pass to the command */
  args: string[];
  /** Whether this suite requires GCP credentials */
  gcpRequired: boolean;
  /** CLI flag that selects this suite */
  flag: string;
}

/** Result of running a single test suite */
interface SuiteResult {
  /** Suite name */
  name: string;
  /** Whether the suite passed, failed, or was skipped */
  status: "passed" | "failed" | "skipped";
  /** Number of tests that passed */
  passed: number;
  /** Number of tests that failed */
  failed: number;
  /** Number of tests skipped */
  skipped: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Reason for skipping (if skipped) */
  skipReason?: string;
  /** Combined stdout + stderr output */
  output: string;
}

/** Parsed CLI arguments */
interface Args {
  /** Run only unit tests */
  unit: boolean;
  /** Run only E2E tests */
  e2e: boolean;
  /** Run only real LLM E2E tests */
  e2eReal: boolean;
  /** Run only GCP smoke tests */
  smoke: boolean;
  /** Force-skip GCP suites */
  noGcp: boolean;
  /** Force-include GCP suites (fail if creds bad) */
  gcp: boolean;
  /** Run Playwright in headed mode (visible browser) */
  headed: boolean;
  /** Run Playwright in UI mode */
  interactive: boolean;
  /** Stream child stdout in real time */
  verbose: boolean;
  /** Release-qualifying run */
  release: boolean;
  /** Cross-link reference (e.g. UR-001/REQ-042) */
  ref: string | null;
  /** Skip archive writing */
  noArchive: boolean;
}

/** Test file entry for the test index */
interface TestFileEntry {
  /** Relative path from web/ */
  path: string;
  /** Describe block names found in the file */
  describes: string[];
}

/** A fixture file that was created or updated during a test run */
interface FixtureUpdate {
  /** Relative path from test-fixtures/ */
  file: string;
  /** Which suite was responsible */
  suite: string;
  /** "created" or "updated" */
  type: "created" | "updated";
}

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
// Logging (matches project convention: → info, ✓ success, ✗ failure)
// ============================================================================

function log(message: string, success?: boolean): void {
  const prefix =
    success === true ? "✓" : success === false ? "✗" : "→";
  console.log(`${prefix} ${message}`);
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs(): Args {
  const argv = process.argv.slice(2);

  /** Check if a flag is present in argv */
  function hasFlag(flag: string): boolean {
    return argv.includes(flag);
  }

  /** Get the value after a flag (e.g. --ref UR-001) */
  function getFlagValue(flag: string): string | null {
    const idx = argv.indexOf(flag);
    if (idx === -1 || idx + 1 >= argv.length) return null;
    return argv[idx + 1];
  }

  return {
    unit: hasFlag("--unit"),
    e2e: hasFlag("--e2e"),
    e2eReal: hasFlag("--e2e-real"),
    smoke: hasFlag("--smoke"),
    noGcp: hasFlag("--no-gcp"),
    gcp: hasFlag("--gcp"),
    headed: hasFlag("--headed"),
    interactive: hasFlag("--interactive"),
    verbose: hasFlag("--verbose"),
    release: hasFlag("--release"),
    ref: getFlagValue("--ref"),
    noArchive: hasFlag("--no-archive"),
  };
}

// ============================================================================
// GCP Credential Detection
// ============================================================================

/** Check if GCP credentials are available via env vars */
function detectGcp(): boolean {
  const projectId = process.env["GCP_PROJECT_ID"];
  const bucket = process.env["GCS_PUBLIC_BUCKET"];
  return Boolean(projectId && bucket);
}

// ============================================================================
// Suite Definitions
// ============================================================================

function buildSuites(args: Args): Suite[] {
  const suites: Suite[] = [
    {
      name: "Unit Tests",
      command: "npx",
      args: ["vitest", "run"],
      gcpRequired: false,
      flag: "--unit",
    },
    {
      name: "E2E Tests",
      command: "npx",
      args: args.interactive
        ? ["playwright", "test", "--ui"]
        : ["playwright", "test", ...(args.headed ? ["--headed"] : [])],
      gcpRequired: false,
      flag: "--e2e",
    },
    {
      name: "E2E Real LLM",
      command: "npx",
      args: ["tsx", "scripts/e2e-real-llm.ts"],
      gcpRequired: true,
      flag: "--e2e-real",
    },
    {
      name: "GCP Smoke",
      command: "npx",
      args: ["tsx", "scripts/smoke-gcp.ts"],
      gcpRequired: true,
      flag: "--smoke",
    },
  ];

  return suites;
}

// ============================================================================
// Suite Filtering
// ============================================================================

/** Determine which suites to run based on CLI args and GCP availability */
function filterSuites(
  suites: Suite[],
  args: Args,
  gcpAvailable: boolean,
): { toRun: Suite[]; skipped: SuiteResult[] } {
  const hasSuiteFilter = args.unit || args.e2e || args.e2eReal || args.smoke;
  const skipped: SuiteResult[] = [];

  const flagMap: Record<string, boolean> = {
    "--unit": args.unit,
    "--e2e": args.e2e,
    "--e2e-real": args.e2eReal,
    "--smoke": args.smoke,
  };

  const toRun: Suite[] = [];

  for (const suite of suites) {
    // If specific suites requested, skip unselected ones
    if (hasSuiteFilter && !flagMap[suite.flag]) {
      skipped.push({
        name: suite.name,
        status: "skipped",
        passed: 0,
        failed: 0,
        skipped: 0,
        durationMs: 0,
        skipReason: "Not selected",
        output: "",
      });
      continue;
    }

    // Handle GCP requirements
    if (suite.gcpRequired) {
      if (args.noGcp) {
        skipped.push({
          name: suite.name,
          status: "skipped",
          passed: 0,
          failed: 0,
          skipped: 0,
          durationMs: 0,
          skipReason: "--no-gcp flag set",
          output: "",
        });
        continue;
      }

      if (!gcpAvailable && !args.gcp) {
        skipped.push({
          name: suite.name,
          status: "skipped",
          passed: 0,
          failed: 0,
          skipped: 0,
          durationMs: 0,
          skipReason: "GCP credentials not detected",
          output: "",
        });
        continue;
      }
    }

    toRun.push(suite);
  }

  return { toRun, skipped };
}

// ============================================================================
// Output Parsing
// ============================================================================

/** Strip ANSI escape codes from a string */
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

/** Parse Vitest output for test counts */
function parseVitestOutput(output: string): {
  passed: number;
  failed: number;
  skipped: number;
} {
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // Find the "Tests" summary line (e.g. "Tests  1228 passed | 3 skipped (1231)")
  const testsLine = output.match(/Tests\s+(.+)\(\d+\)/);
  if (testsLine) {
    const segment = testsLine[1];
    const passedMatch = segment.match(/(\d+)\s+passed/);
    const failedMatch = segment.match(/(\d+)\s+failed/);
    const skippedMatch = segment.match(/(\d+)\s+skipped/);
    if (passedMatch) passed = parseInt(passedMatch[1], 10);
    if (failedMatch) failed = parseInt(failedMatch[1], 10);
    if (skippedMatch) skipped = parseInt(skippedMatch[1], 10);
  }

  return { passed, failed, skipped };
}

/** Parse Playwright output for test counts */
function parsePlaywrightOutput(output: string): {
  passed: number;
  failed: number;
  skipped: number;
} {
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // Playwright format: "N passed", "N failed", "N skipped"
  const passedMatch = output.match(/(\d+)\s+passed/);
  const failedMatch = output.match(/(\d+)\s+failed/);
  const skippedMatch = output.match(/(\d+)\s+skipped/);

  if (passedMatch) passed = parseInt(passedMatch[1], 10);
  if (failedMatch) failed = parseInt(failedMatch[1], 10);
  if (skippedMatch) skipped = parseInt(skippedMatch[1], 10);

  return { passed, failed, skipped };
}

/** Parse custom script output (e2e-real-llm, smoke-gcp) for pass/fail counts */
function parseCustomScriptOutput(output: string): {
  passed: number;
  failed: number;
  skipped: number;
} {
  // Count ✓ and ✗ prefixes in the output
  const passedLines = (output.match(/^✓/gm) || []).length;
  const failedLines = (output.match(/^✗/gm) || []).length;

  return { passed: passedLines, failed: failedLines, skipped: 0 };
}

/** Parse suite output based on suite name */
function parseSuiteOutput(
  suiteName: string,
  output: string,
): { passed: number; failed: number; skipped: number } {
  const cleanOutput = stripAnsi(output);
  if (suiteName === "Unit Tests") {
    return parseVitestOutput(cleanOutput);
  }
  if (suiteName === "E2E Tests") {
    return parsePlaywrightOutput(cleanOutput);
  }
  return parseCustomScriptOutput(cleanOutput);
}

// ============================================================================
// Prerequisite Checks
// ============================================================================

/** Check if Chrome is running (macOS). E2E suites hang silently without it. */
function isChromeRunning(): boolean {
  try {
    execSync("pgrep -q 'Google Chrome'", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Fail fast if any E2E suite is about to run but Chrome isn't up. */
function checkChromePrerequisite(suitesToRun: Suite[]): void {
  const needsChrome = suitesToRun.some(
    (s) => s.name === "E2E Tests" || s.name === "E2E Real LLM",
  );
  if (!needsChrome) return;

  if (!isChromeRunning()) {
    log("Google Chrome is not running — E2E tests require it", false);
    log("Launch Chrome and try again, or run: open -a 'Google Chrome'", false);
    process.exit(1);
  }
  log("Chrome is running", true);
}

// ============================================================================
// Fixture Mtime Tracking
// ============================================================================

/** Walk test-fixtures/ recursively and return Map<relativePath, mtimeMs> */
function snapshotFixtureMtimes(): Map<string, number> {
  const fixtureDir = resolve(__dirname, "..", "test-fixtures");
  const mtimes = new Map<string, number>();

  if (!existsSync(fixtureDir)) return mtimes;

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name !== "README.md") {
        const rel = relative(fixtureDir, full);
        const stat = statSync(full);
        mtimes.set(rel, stat.mtimeMs);
      }
    }
  }

  walk(fixtureDir);
  return mtimes;
}

/** Compare before/after mtime snapshots; return files that were created or updated */
function diffFixtureMtimes(
  before: Map<string, number>,
  after: Map<string, number>,
): { file: string; type: "created" | "updated" }[] {
  const changes: { file: string; type: "created" | "updated" }[] = [];

  for (const [file, afterMtime] of after) {
    const beforeMtime = before.get(file);
    if (beforeMtime === undefined) {
      changes.push({ file, type: "created" });
    } else if (afterMtime !== beforeMtime) {
      changes.push({ file, type: "updated" });
    }
  }

  return changes;
}

/**
 * Attribute fixture changes to suites using suite start/end timestamps.
 *
 * Since suites run sequentially, a file whose mtime falls within a suite's
 * [startMs, endMs] window is attributed to that suite. Files that cannot be
 * attributed are assigned to "unknown".
 */
function attributeSuiteToFixture(
  diffs: { file: string; type: "created" | "updated" }[],
  suiteTiming: { name: string; startMs: number; endMs: number }[],
  afterSnapshot: Map<string, number>,
): FixtureUpdate[] {
  return diffs.map((d) => {
    const mtime = afterSnapshot.get(d.file) ?? 0;

    // Find the suite whose execution window contains this file's mtime
    const suite = suiteTiming.find(
      (s) => mtime >= s.startMs && mtime <= s.endMs,
    );

    return {
      file: d.file,
      suite: suite?.name ?? "unknown",
      type: d.type,
    };
  });
}

// ============================================================================
// Suite Execution
// ============================================================================

/** Run a single suite and return its result */
function runSuite(suite: Suite, verbose: boolean): Promise<SuiteResult> {
  return new Promise((resolvePromise) => {
    const startTime = Date.now();
    const webDir = resolve(__dirname, "..");
    let output = "";

    log(`Running ${suite.name}...`);

    const child: ChildProcess = spawn(suite.command, suite.args, {
      cwd: webDir,
      env: { ...process.env, FORCE_COLOR: "1" },
      stdio: verbose ? ["inherit", "pipe", "pipe"] : ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    child.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      output += text;
      if (verbose) {
        process.stdout.write(text);
      }
    });

    child.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      output += text;
      if (verbose) {
        process.stderr.write(text);
      }
    });

    child.on("close", (code: number | null) => {
      const durationMs = Date.now() - startTime;
      const exitCode = code ?? 1;
      const counts = parseSuiteOutput(suite.name, output);

      const status: SuiteResult["status"] =
        exitCode === 0 ? "passed" : "failed";

      if (status === "passed") {
        log(`${suite.name} passed (${formatDuration(durationMs)})`, true);
      } else {
        log(`${suite.name} failed (exit code ${exitCode})`, false);
      }

      resolvePromise({
        name: suite.name,
        status,
        passed: counts.passed,
        failed: counts.failed,
        skipped: counts.skipped,
        durationMs,
        output,
      });
    });

    child.on("error", (err: Error) => {
      const durationMs = Date.now() - startTime;
      log(`${suite.name} failed to start: ${err.message}`, false);

      resolvePromise({
        name: suite.name,
        status: "failed",
        passed: 0,
        failed: 0,
        skipped: 0,
        durationMs,
        output: err.message,
      });
    });
  });
}

// ============================================================================
// Test Index
// ============================================================================

/** Scan test files and extract describe block names */
function buildTestIndex(): TestFileEntry[] {
  const webDir = resolve(__dirname, "..");
  const entries: TestFileEntry[] = [];

  // Gather unit test files
  const unitTestFiles = findTestFiles(
    resolve(webDir, "src"),
    /\.test\.tsx?$/,
    webDir,
  );

  // Gather E2E spec files
  const e2eDir = resolve(webDir, "e2e");
  const e2eTestFiles = existsSync(e2eDir)
    ? findTestFiles(e2eDir, /\.spec\.ts$/, webDir)
    : [];

  for (const filePath of [...unitTestFiles, ...e2eTestFiles]) {
    const absolutePath = resolve(webDir, filePath);
    try {
      const content = readFileSync(absolutePath, "utf-8");
      const describes: string[] = [];

      // Match describe("...") and test.describe("...")
      const describeRegex = /(?:describe|test\.describe)\(\s*["'`]([^"'`]+)["'`]/g;
      let match: RegExpExecArray | null;
      while ((match = describeRegex.exec(content)) !== null) {
        describes.push(match[1]);
      }

      entries.push({ path: filePath, describes });
    } catch {
      // Skip files that can't be read
    }
  }

  return entries;
}

/** Recursively find files matching a pattern */
function findTestFiles(
  dir: string,
  pattern: RegExp,
  baseDir: string,
): string[] {
  const results: string[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules") {
        results.push(...findTestFiles(fullPath, pattern, baseDir));
      } else if (entry.isFile() && pattern.test(entry.name)) {
        // Return path relative to baseDir
        results.push(fullPath.replace(baseDir + "/", ""));
      }
    }
  } catch {
    // Skip directories that can't be read
  }

  return results;
}

// ============================================================================
// Summary Table
// ============================================================================

/** Format milliseconds to human-readable duration */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/** Pad a string to a given width */
function padRight(str: string, width: number): string {
  return str + " ".repeat(Math.max(0, width - str.length));
}

/** Pad a number string to a given width (left-padded) */
function padLeft(str: string, width: number): string {
  return " ".repeat(Math.max(0, width - str.length)) + str;
}

/** Print the colored summary table */
function printSummaryTable(results: SuiteResult[]): void {
  const COL_NAME = 20;
  const COL_STATUS = 10;
  const COL_PASS = 8;
  const COL_FAIL = 8;
  const COL_SKIP = 8;
  const COL_TIME = 10;
  const TOTAL_WIDTH = COL_NAME + COL_STATUS + COL_PASS + COL_FAIL + COL_SKIP + COL_TIME + 5;

  console.log("");
  console.log("=".repeat(TOTAL_WIDTH));
  console.log(
    colorize(ANSI.bold + "  TEST SUMMARY", ANSI.cyan),
  );
  console.log("=".repeat(TOTAL_WIDTH));

  // Header row
  const header =
    padRight("Suite", COL_NAME) +
    " " +
    padRight("Status", COL_STATUS) +
    " " +
    padLeft("Passed", COL_PASS) +
    " " +
    padLeft("Failed", COL_FAIL) +
    " " +
    padLeft("Skip", COL_SKIP) +
    " " +
    padLeft("Time", COL_TIME);
  console.log(colorize(header, ANSI.bold));
  console.log("-".repeat(TOTAL_WIDTH));

  for (const result of results) {
    const statusColor =
      result.status === "passed"
        ? ANSI.green
        : result.status === "failed"
          ? ANSI.red
          : ANSI.yellow;

    const row =
      padRight(result.name, COL_NAME) +
      " " +
      colorize(padRight(result.status.toUpperCase(), COL_STATUS), statusColor) +
      " " +
      colorize(padLeft(String(result.passed), COL_PASS), ANSI.green) +
      " " +
      colorize(
        padLeft(String(result.failed), COL_FAIL),
        result.failed > 0 ? ANSI.red : ANSI.dim,
      ) +
      " " +
      colorize(
        padLeft(String(result.skipped), COL_SKIP),
        result.skipped > 0 ? ANSI.yellow : ANSI.dim,
      ) +
      " " +
      padLeft(formatDuration(result.durationMs), COL_TIME);

    console.log(row);

    // If skipped, show reason
    if (result.status === "skipped" && result.skipReason) {
      console.log(
        colorize(`  └─ ${result.skipReason}`, ANSI.dim),
      );
    }
  }

  console.log("-".repeat(TOTAL_WIDTH));

  // Totals row
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
  const totalTime = results.reduce((sum, r) => sum + r.durationMs, 0);

  const totalRow =
    colorize(padRight("TOTAL", COL_NAME), ANSI.bold) +
    " " +
    padRight("", COL_STATUS) +
    " " +
    colorize(padLeft(String(totalPassed), COL_PASS), ANSI.green) +
    " " +
    colorize(
      padLeft(String(totalFailed), COL_FAIL),
      totalFailed > 0 ? ANSI.red : ANSI.dim,
    ) +
    " " +
    colorize(
      padLeft(String(totalSkipped), COL_SKIP),
      totalSkipped > 0 ? ANSI.yellow : ANSI.dim,
    ) +
    " " +
    padLeft(formatDuration(totalTime), COL_TIME);

  console.log(totalRow);
  console.log("=".repeat(TOTAL_WIDTH));
}

// ============================================================================
// Release Mode Checklist
// ============================================================================

/** Print release verification checklist */
function printReleaseChecklist(results: SuiteResult[]): void {
  console.log("");
  console.log("===================================================================");
  console.log(colorize("  RELEASE VERIFICATION CHECKLIST", ANSI.cyan + ANSI.bold));
  console.log("===================================================================");

  const allPassed = results.every(
    (r) => r.status === "passed" || r.status === "skipped",
  );
  const hasFailures = results.some((r) => r.status === "failed");
  const gcpSuitesRan = results.some(
    (r) => (r.name === "E2E Real LLM" || r.name === "GCP Smoke") && r.status !== "skipped",
  );

  const checks = [
    { label: "All suites executed", ok: results.every((r) => r.status !== "skipped") },
    { label: "No test failures", ok: !hasFailures },
    { label: "GCP integration verified", ok: gcpSuitesRan },
    { label: "Unit tests passed", ok: results.find((r) => r.name === "Unit Tests")?.status === "passed" },
    { label: "E2E tests passed", ok: results.find((r) => r.name === "E2E Tests")?.status === "passed" },
    { label: "Real LLM tests passed", ok: results.find((r) => r.name === "E2E Real LLM")?.status === "passed" },
    { label: "GCP smoke tests passed", ok: results.find((r) => r.name === "GCP Smoke")?.status === "passed" },
  ];

  for (const check of checks) {
    const icon = check.ok ? "✓" : "✗";
    const color = check.ok ? ANSI.green : ANSI.red;
    console.log(colorize(`  ${icon} ${check.label}`, color));
  }

  console.log("-------------------------------------------------------------------");
  if (allPassed && !hasFailures) {
    console.log(colorize("  ✓ RELEASE QUALIFICATION: PASSED", ANSI.green + ANSI.bold));
  } else {
    console.log(colorize("  ✗ RELEASE QUALIFICATION: FAILED", ANSI.red + ANSI.bold));
  }
  console.log("===================================================================");
}

// ============================================================================
// Test Index Display
// ============================================================================

/** Print the test file index */
function printTestIndex(entries: TestFileEntry[]): void {
  console.log("");
  console.log("===================================================================");
  console.log(colorize("  TEST INDEX", ANSI.cyan + ANSI.bold));
  console.log("===================================================================");

  for (const entry of entries) {
    console.log(colorize(`  ${entry.path}`, ANSI.white));
    for (const desc of entry.describes) {
      console.log(colorize(`    └─ ${desc}`, ANSI.dim));
    }
  }

  console.log("-------------------------------------------------------------------");
  console.log(
    `  ${entries.length} test files, ${entries.reduce((sum, e) => sum + e.describes.length, 0)} describe blocks`,
  );
  console.log("===================================================================");
}

// ============================================================================
// Archive
// ============================================================================

/** Map suite name to a filesystem-safe slug for log filenames */
function suiteSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/** Map suite name to the flag slug used in suites_run frontmatter */
function suiteFlagSlug(name: string): string {
  const map: Record<string, string> = {
    "Unit Tests": "unit",
    "E2E Tests": "e2e",
    "E2E Real LLM": "e2e-real",
    "GCP Smoke": "smoke",
  };
  return map[name] ?? suiteSlug(name);
}

/** Format a Date as an ISO-8601 string with PST offset (-08:00) */
function toPstIso(date: Date): string {
  // Convert to PST (UTC-8)
  const pstOffsetMs = -8 * 60 * 60 * 1000;
  const pst = new Date(date.getTime() + pstOffsetMs + date.getTimezoneOffset() * 60 * 1000);

  const pad2 = (n: number): string => String(n).padStart(2, "0");
  const y = pst.getFullYear();
  const mo = pad2(pst.getMonth() + 1);
  const d = pad2(pst.getDate());
  const h = pad2(pst.getHours());
  const mi = pad2(pst.getMinutes());
  const s = pad2(pst.getSeconds());

  return `${y}-${mo}-${d}T${h}:${mi}:${s}-08:00`;
}

/** Format a Date as a human-readable PST string */
function toPstHuman(date: Date): string {
  const pstOffsetMs = -8 * 60 * 60 * 1000;
  const pst = new Date(date.getTime() + pstOffsetMs + date.getTimezoneOffset() * 60 * 1000);

  const pad2 = (n: number): string => String(n).padStart(2, "0");
  const y = pst.getFullYear();
  const mo = pad2(pst.getMonth() + 1);
  const d = pad2(pst.getDate());
  const h = pad2(pst.getHours());
  const mi = pad2(pst.getMinutes());
  const s = pad2(pst.getSeconds());

  return `${y}-${mo}-${d} ${h}:${mi}:${s} PST`;
}

/** Build a filesystem-safe directory name from a Date in PST */
function toPstDirName(date: Date): string {
  const iso = toPstIso(date);
  // Extract "YYYY-MM-DDTHH:MM:SS" and replace colons and T
  return iso.slice(0, 19).replace("T", "_").replace(/:/g, "-");
}

/** Options bag for writeArchive */
interface ArchiveOptions {
  results: SuiteResult[];
  ref: string | null;
  release: boolean;
  noArchive: boolean;
  gcpAvailable: boolean;
  testIndex: TestFileEntry[];
  fixtureUpdates: FixtureUpdate[];
}

/** Write test-run archive: summary.md + per-suite .log files */
function writeArchive(opts: ArchiveOptions): void {
  if (opts.noArchive) {
    log("Archive writing skipped (--no-archive)");
    return;
  }

  const now = new Date();
  const webDir = resolve(__dirname, "..");
  const timestampDir = toPstDirName(now);
  const archiveDir = resolve(webDir, "..", "do-work", "archive", "test-runs", timestampDir);

  // Create archive directory
  mkdirSync(archiveDir, { recursive: true });

  // Determine overall status
  const overallStatus = opts.results.some((r) => r.status === "failed") ? "fail" : "pass";

  // Determine which suites were actually run (not skipped)
  const suitesRun = opts.results
    .filter((r) => r.status !== "skipped")
    .map((r) => suiteFlagSlug(r.name));

  // ---- Build summary.md ----
  const frontmatterLines: string[] = [
    "---",
    `timestamp: ${toPstIso(now)}`,
  ];
  if (opts.ref) {
    frontmatterLines.push(`triggered_by: ${opts.ref}`);
  }
  if (opts.release) {
    frontmatterLines.push("release_candidate: true");
  }
  frontmatterLines.push(`gcp_available: ${opts.gcpAvailable}`);
  frontmatterLines.push(`suites_run: [${suitesRun.join(", ")}]`);
  frontmatterLines.push(`overall: ${overallStatus}`);
  frontmatterLines.push("---");

  const summaryLines: string[] = [
    ...frontmatterLines,
    "",
    `# Test Run: ${toPstHuman(now)}`,
    "",
    "## Summary",
    "",
    "| Suite | Status | Passed | Failed | Skipped | Duration |",
    "|-------|--------|--------|--------|---------|----------|",
  ];

  for (const r of opts.results) {
    const status = r.status.toUpperCase();
    const duration = formatDuration(r.durationMs);
    summaryLines.push(
      `| ${r.name} | ${status} | ${r.passed} | ${r.failed} | ${r.skipped} | ${duration} |`,
    );
  }

  // Totals row
  const totalPassed = opts.results.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = opts.results.reduce((sum, r) => sum + r.failed, 0);
  const totalSkipped = opts.results.reduce((sum, r) => sum + r.skipped, 0);
  const totalDuration = opts.results.reduce((sum, r) => sum + r.durationMs, 0);
  summaryLines.push(
    `| **Total** | | **${totalPassed}** | **${totalFailed}** | **${totalSkipped}** | **${formatDuration(totalDuration)}** |`,
  );

  // Test index section
  summaryLines.push("");
  summaryLines.push("## Test Index");
  summaryLines.push("");

  if (opts.testIndex.length > 0) {
    summaryLines.push("| File | Describe Blocks |");
    summaryLines.push("|------|-----------------|");
    for (const entry of opts.testIndex) {
      const describes = entry.describes.length > 0 ? entry.describes.join(", ") : "(none)";
      summaryLines.push(`| ${entry.path} | ${describes} |`);
    }
  } else {
    summaryLines.push("No test files found.");
  }

  // Fixture updates section
  summaryLines.push("");
  summaryLines.push("## Fixture Updates");
  summaryLines.push("");
  if (opts.fixtureUpdates.length > 0) {
    summaryLines.push("| File | Suite | Type |");
    summaryLines.push("|------|-------|------|");
    for (const f of opts.fixtureUpdates) {
      summaryLines.push(`| ${f.file} | ${f.suite} | ${f.type} |`);
    }
    summaryLines.push("");
    const n = opts.fixtureUpdates.length;
    summaryLines.push(`_${n} fixture(s) updated during this run._`);
  } else {
    summaryLines.push("No fixtures were updated during this run.");
  }

  // Manual verifications section
  summaryLines.push("");
  summaryLines.push("## Manual Verifications (informational -- not gated)");
  summaryLines.push("");
  summaryLines.push("- [ ] VER-001: Visual inspect resume PDF layout");
  summaryLines.push("- [ ] VER-002: OAuth flow in fresh browser session");
  summaryLines.push("- [ ] VER-003: Cloud Run deployment serves traffic");

  // Cross-references section
  summaryLines.push("");
  summaryLines.push("## Cross-references");
  summaryLines.push("");
  if (opts.ref) {
    summaryLines.push(`- Triggered by: ${opts.ref}`);
  }

  // List raw log filenames
  const logFiles = opts.results
    .filter((r) => r.status !== "skipped" && r.output.length > 0)
    .map((r) => `${suiteSlug(r.name)}.log`);
  if (logFiles.length > 0) {
    summaryLines.push(`- Raw logs: ${logFiles.join(", ")} (gitignored, local only)`);
  }

  // Write summary.md
  const summaryPath = resolve(archiveDir, "summary.md");
  writeFileSync(summaryPath, summaryLines.join("\n") + "\n", "utf-8");

  // ---- Write per-suite log files ----
  for (const r of opts.results) {
    if (r.status === "skipped" || r.output.length === 0) continue;
    const logPath = resolve(archiveDir, `${suiteSlug(r.name)}.log`);
    writeFileSync(logPath, stripAnsi(r.output), "utf-8");
  }

  log(`Archive written to do-work/archive/test-runs/${timestampDir}/`, true);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const args = parseArgs();
  const gcpAvailable = detectGcp();

  // Header
  console.log("");
  console.log("===================================================================");
  console.log(colorize("  MASTER TEST RUNNER", ANSI.cyan + ANSI.bold));
  console.log("===================================================================");

  // Release mode validation
  if (args.release) {
    log("Release mode enabled — all suites required");
    if (!gcpAvailable) {
      log("GCP credentials not detected — required for release mode", false);
      log("Set GCP_PROJECT_ID and GCS_PUBLIC_BUCKET in web/.env.local", false);
      process.exit(1);
    }
    // Release implies --gcp and all suites
    args.gcp = true;
  }

  // Report GCP status
  if (gcpAvailable) {
    log(`GCP credentials detected (project: ${process.env["GCP_PROJECT_ID"]})`, true);
  } else {
    log("GCP credentials not detected — GCP suites will be skipped");
  }

  if (args.ref) {
    log(`Work reference: ${args.ref}`);
  }

  // Build test index
  const testIndex = buildTestIndex();
  printTestIndex(testIndex);

  // Build and filter suites
  const suites = buildSuites(args);
  const { toRun, skipped } = filterSuites(suites, args, gcpAvailable);

  if (toRun.length === 0) {
    log("No suites to run", false);
    printSummaryTable(skipped);
    process.exit(0);
  }

  // Pre-flight: ensure Chrome is running if E2E suites are selected
  checkChromePrerequisite(toRun);

  log(`Running ${toRun.length} suite(s), ${skipped.length} skipped`);
  console.log("-------------------------------------------------------------------");

  // Snapshot fixture mtimes before suite execution
  const fixturesBefore = snapshotFixtureMtimes();

  // Execute suites sequentially
  const results: SuiteResult[] = [...skipped];
  const suiteTiming: { name: string; startMs: number; endMs: number }[] = [];

  for (const suite of toRun) {
    console.log("");
    const startMs = Date.now();
    const result = await runSuite(suite, args.verbose);
    const endMs = Date.now();
    results.push(result);
    suiteTiming.push({ name: suite.name, startMs, endMs });

    // If a suite fails and we're not in release mode, print its output
    if (result.status === "failed" && !args.verbose) {
      console.log("");
      console.log(colorize(`--- ${suite.name} output ---`, ANSI.red));
      // Print last 50 lines of output to avoid flooding
      const lines = result.output.split("\n");
      const tail = lines.slice(Math.max(0, lines.length - 50));
      console.log(tail.join("\n"));
      console.log(colorize(`--- end ${suite.name} output ---`, ANSI.red));
    }
  }

  // Diff fixture mtimes after suite execution
  const fixturesAfter = snapshotFixtureMtimes();
  const fixtureDiffs = diffFixtureMtimes(fixturesBefore, fixturesAfter);
  const fixtureUpdates = attributeSuiteToFixture(fixtureDiffs, suiteTiming, fixturesAfter);

  // Sort results to match suite definition order
  const suiteOrder = suites.map((s) => s.name);
  results.sort(
    (a, b) => suiteOrder.indexOf(a.name) - suiteOrder.indexOf(b.name),
  );

  // Print summary
  printSummaryTable(results);

  // Release checklist
  if (args.release) {
    printReleaseChecklist(results);
  }

  // Write archive
  writeArchive({
    results,
    ref: args.ref,
    release: args.release,
    noArchive: args.noArchive,
    gcpAvailable,
    testIndex,
    fixtureUpdates,
  });

  // Exit code
  const hasFailures = results.some((r) => r.status === "failed");
  if (hasFailures) {
    log("Some suites failed", false);
    process.exit(1);
  } else {
    log("All suites passed", true);
    process.exit(0);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  log(`Unexpected error: ${message}`, false);
  process.exit(1);
});
