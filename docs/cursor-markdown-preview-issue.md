# Cursor Markdown Preview Issue: Proposal.md

## Problem Description

When opening **Markdown preview** for `docs/Proposal.md` in Cursor:

1. **Step 2 (right-click → Open Preview):** The file may be reported as "cannot be found" when using the Explorer context menu.
2. **Step 3 (⌘⇧V with file open):** Cursor shows: **"The editor could not be opened due to an unexpected error. Please consult the log for more details."**

The file exists at `docs/Proposal.md` and is readable on disk. The failure is specific to opening the **preview** (rendered Markdown) for this file inside Cursor.

---

## Log Analysis

**Log location:**  
`~/Library/Application Support/Cursor/logs/20260205T131640/window4/renderer.log`

### 1. Document retrieval failure

The log shows:

```
Unable to retrieve document from URI 'file:///Users/sam/Projects/samkirk-v3/docs/Proposal.md': Error: Unable to retrieve document from URI 'file:///Users/sam/Projects/samkirk-v3/docs/Proposal.md'
	at Jds.getDocument (extensionHostProcess.js:...)
	at kds.$resolveCustomEditor (extensionHostProcess.js:...)
	...
```

The Markdown preview is implemented as a **custom editor**. When opening the preview, the workbench asks the extension host for the document at that URI. The extension host’s `getDocument` / `$resolveCustomEditor` fails to return the document, so the preview never receives content.

### 2. Follow-up assertion failure

Immediately after, the workbench logs:

```
Error: Assertion Failed: Argument is `undefined` or `null`.
    at ... setInput (...)
    at ... doOpenEditor (...)
    at async ... handleDrop (...)
```

Because the document was never retrieved, the editor’s `setInput` is called with `undefined` or `null`. The workbench asserts on that and throws, which surfaces as “The editor could not be opened due to an unexpected error.”

**Summary:** The preview fails because Cursor cannot provide the document for that URI to the Markdown preview editor; the subsequent null/undefined input causes the crash the user sees.

---

## Likely Causes (from local analysis + community research)

### A. Per-window document state

- The **Markdown preview** runs in the **extension host** for the current window.
- The **document** for a file is associated with the window (and tab) where it was opened.
- If you have **multiple Cursor windows** open, or the file was opened in a different context, the extension host for the window where “Open Preview” runs may not have that document in its document model → “Unable to retrieve document” → assertion failure.

### B. Lazy document initialization (Cursor forum)

The same error is reported on the Cursor forum for **custom editors** (including Markdown preview): [Assertion error when using custom editors incl. markdown preview editors](https://forum.cursor.com/t/assertion-error-when-using-custom-editors-incl-markdown-preview-editors/148578).

- Cursor can **lazily initialize** document state. The `TextDocument` for a file may not be fully registered until the file is opened in the **standard text editor** first.
- Files that were **AI-created** or first seen in a **diff/review** view are especially prone to this: custom editors (including Markdown preview) ask for the document before that initialization has happened.
- The failure occurs **inside Cursor/VS Code core** before the Markdown extension’s provider runs (no call into `resolveCustomTextEditor`).

### C. Extension conflict: Office Viewer

Community reports (e.g. [Dre Dyson’s fix](https://dredyson.com/fix-cursor-ides-unable-to-open-md-files-error-in-90-seconds-proven-workaround/)) attribute the same “Unable to open / Assertion Failed” behavior to the **Office Viewer** extension conflicting with Cursor’s Markdown handling: it can hijack `.md` files and create “phantom” file locks so the document is not available to the preview.

---

## Workarounds

### Try first (quick)

1. **Open with Text Editor once (Cursor forum workaround)**  
   Right-click `docs/Proposal.md` → **Open With…** → **Text Editor**. Open it once, then close the tab. No need to edit or save. After that, try **Markdown: Open Preview** (⌘⇧V) again. This forces Cursor to initialize document state for that file.

2. **Disable or reconfigure Office Viewer (if installed)**  
   - **Extensions** (⌘⇧X) → search **Office Viewer** → gear → **Disable**. Test preview immediately (no restart).  
   - To keep the extension: add to `settings.json`: `"office-viewer.autoOpen": false`  
   - Optional CLI: `cursor --disable-extensions=ms-vscode.vscode-office`

3. **Single window + same-window open**  
   Close other Cursor windows. In the window that has `samkirk-v3` open, use **File → Open File** (or ⌘P) to open `docs/Proposal.md`, then trigger **Markdown: Open Preview** (⌘⇧V or Command Palette → “Markdown: Open Preview”).

### If still failing

4. **Force file refresh (community workaround)**  
   In terminal: `touch docs/Proposal.md` (Mac/Linux) or `copy /b docs/Proposal.md +,,` (Windows). Then click the file tab and try preview again.

5. **Restart Cursor**  
   A full restart often resolves transient document/preview issues (common in VS Code–based editors).

6. **Clear Cursor caches (last resort)**  
   - Mac: `rm -rf ~/Library/Application\ Support/Cursor/*Cache*`  
   - Windows: `Del %APPDATA%\Cursor\Cache\* /q/s`  
   - Linux: `rm -rf ~/.config/Cursor/Cache`  
   Then restart Cursor.

### Optional settings (community-reported)

Some users report fewer Markdown issues with these in `settings.json` (use with caution; `cursor.experimental.markdownPreview` is not officially documented):

```json
{
  "files.useExperimentalFileWatcher": true,
  "cursor.experimental.markdownPreview": "native",
  "workbench.editor.enablePreviewFromQuickOpen": false
}
```

### Reporting the bug

If none of the above help, report to Cursor with:

- Exact message: “The editor could not be opened due to an unexpected error.”
- Log excerpt: `Unable to retrieve document from URI 'file:///.../docs/Proposal.md'` in `window4/renderer.log`, followed by `Assertion Failed: Argument is undefined or null` in `setInput` / `doOpenEditor`.
- Link to this forum thread: [Assertion error when using custom editors incl. markdown preview editors](https://forum.cursor.com/t/assertion-error-when-using-custom-editors-incl-markdown-preview-editors/148578)

### Temporary workaround

View the file in another Markdown viewer or read it in another editor. The file on disk is valid and readable.

---

## References

- [Assertion error when using custom editors incl. markdown preview editors](https://forum.cursor.com/t/assertion-error-when-using-custom-editors-incl-markdown-preview-editors/148578) — Cursor Community Forum (Jan 2026): same log pattern, “Open with Text Editor” workaround, lazy-init explanation.
- [Fix Cursor IDE’s ‘Unable to Open .md Files’ Error (90-Second Workaround)](https://dredyson.com/fix-cursor-ides-unable-to-open-md-files-error-in-90-seconds-proven-workaround/) — Office Viewer conflict, disable/autoOpen, optional settings, touch/cache steps.
- VS Code: “editor could not be opened” / markdown preview issues are often resolved by restart, not running as Administrator, and checking extension conflicts.

---

## Documented

- **Date:** 2026-02-06  
- **Updated:** 2026-02-06 (web research, community workarounds, references)  
- **Cursor log session:** `20260205T131640`, `window4/renderer.log`  
- **File affected:** `docs/Proposal.md`
