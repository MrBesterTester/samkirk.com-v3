// TEMPORARY diagnostic, not committed: thinking tokens and finish reasons for
// the production interview path at each thinking level and output cap.
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

async function main() {
  const { getResumeContext } = await import("../src/lib/resume-context");
  const { buildInterviewSystemPrompt } = await import("../src/lib/interview-chat");
  const { generateContentWithHistory } = await import("../src/lib/vertex-ai");
  const ctx = await getResumeContext();
  const systemInstruction = buildInterviewSystemPrompt(ctx.contextString);
  const questions = [
    "What programming languages do you know?",
    "Walk me through Sam's entire career history.",
  ];
  const levels = (process.argv[2] ?? "MINIMAL,LOW").split(",") as Array<"MINIMAL" | "LOW">;
  const caps = (process.argv[3] ?? "1024,3072").split(",").map(Number);
  for (const level of levels) {
    for (const cap of caps) {
      for (const q of questions) {
        const r = await generateContentWithHistory([], q, {
          systemInstruction, temperature: 0.7, maxOutputTokens: cap,
          thinkingLevel: level, skipSpendCap: true,
        });
        console.log(JSON.stringify({ level, cap, q: q.slice(0, 30), finish: r.finishReason,
          billableOut: r.usage.outputTokens, chars: r.text.length, tail: r.text.slice(-60) }));
      }
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
