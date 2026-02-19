---
id: UR-040
title: "Gate Vercel deployment behind GitHub Actions CI"
created_at: 2026-02-19T08:22:00-08:00
source: conversation
---

# Gate Vercel deployment behind GitHub Actions CI

Discovered during the /ship pipeline on 2026-02-19 that Vercel's GitHub integration auto-deploys on push to main, independent of GitHub Actions CI. This means broken builds, leaked secrets, or security vulnerabilities can go live before CI catches them.

The /ship pipeline assumed CI gates the Vercel deployment (Step 6: "CI passing triggers Vercel auto-deploy"), but in reality both run in parallel off the same push event. A build stamp of v02-19-2026_08:18 appeared on the live site while CI was still running — confirming the deployment raced ahead of the security scan.

Fix: Disable Vercel's automatic Git deployments and deploy from GitHub Actions only after CI passes.
