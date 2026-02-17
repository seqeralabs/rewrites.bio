import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "fs";
import { parse } from "yaml";

const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const today = new Date().toISOString().split("T")[0];

const manifesto = parse(readFileSync("src/data/manifesto.yaml", "utf-8"));

// Generate manifesto markdown
let md = `---
title: rewrites.bio
description: Principles for AI-assisted rewrites of bioinformatics tools
url: https://rewrites.bio
source: https://github.com/ewels/rewrites.bio
updated: ${today}
---

# rewrites.bio - Rewrite it, for Bioinformatics

> Rewriting bioinformatics tools with AI. Responsibly.

Many of our most trusted tools were written years ago, when datasets were orders of magnitude smaller. They work correctly. They are thoroughly validated. They are also slow, dependency-heavy, and expensive to run at modern sequencing scale.

Tools that were fast enough ten years ago are now a bottleneck: in time, in cost, and in environmental impact. Rewrites that cut runtimes, reduce dependencies, and lower resource consumption are not just nice to have. At modern scale, they are becoming essential.

AI coding assistants have changed the equation. A domain expert can now rewrite established tools in compiled languages in days, not years. Fast code has become cheap. The scientific insight, careful validation, and community trust behind the original tools have not.

> *A wave of AI-assisted rewrites is coming.*
> *The question is not whether it will happen, but whether it will happen well.*

These are the principles we follow.

---

`;

for (const [si, section] of manifesto.sections.entries()) {
  md += `## ${romanNumerals[si]}. ${section.title}\n\n`;
  for (const [pi, p] of section.principles.entries()) {
    md += `### ${si + 1}.${pi + 1} ${p.title}\n\n${p.description}\n`;
  }
}

md += `---

Website: [rewrites.bio](https://rewrites.bio)
Source: [github.com/ewels/rewrites.bio](https://github.com/ewels/rewrites.bio)
`;

writeFileSync("public/index.md", md);
copyFileSync("public/index.md", "public/manifesto.md");

// Generate .well-known/agent.md
mkdirSync("public/.well-known", { recursive: true });

const agentMd = `---
purpose: Context and instructions for AI agents
url: https://rewrites.bio
version: 1.0
updated: ${today}
---

# rewrites.bio

> Rewriting bioinformatics tools with AI. Responsibly.

## What this is

rewrites.bio is a manifesto defining 15 principles for the responsible AI-assisted rewriting of established bioinformatics tools in faster, compiled languages.

## How to access content

- **Markdown version:** Request \`https://rewrites.bio/\` with \`Accept: text/markdown\` or \`Accept: text/plain\`
- **Direct markdown:** \`https://rewrites.bio/manifesto.md\`
- **HTML version:** \`https://rewrites.bio/\` (default)

## Docs

- [The Manifesto](https://rewrites.bio/manifesto.md): The full set of 15 principles across 4 sections (Philosophy, Planning, Building, Stewardship)
`;

writeFileSync("public/.well-known/agent.md", agentMd);

console.log(
  "Generated: public/index.md, public/manifesto.md, public/.well-known/agent.md",
);
