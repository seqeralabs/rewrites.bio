import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "fs";
import { parse } from "yaml";

const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const today = new Date().toISOString().split("T")[0];

const manifesto = parse(readFileSync("src/data/manifesto.yaml", "utf-8"));

// Count total principles
const totalPrinciples = manifesto.sections.reduce(
  (sum, s) => sum + s.principles.length,
  0,
);

// Build preamble from YAML
const preambleText = manifesto.preamble
  .map((p) => p.trim())
  .join("\n\n");

const calloutText = manifesto.callout
  .trim()
  .split("\n")
  .map((line) => `> ${line.trim()}`)
  .join("\n");

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

${preambleText}

${calloutText}

${manifesto.preamble_closing.trim()}

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

rewrites.bio is a manifesto defining ${totalPrinciples} principles for the responsible AI-assisted rewriting of established bioinformatics tools in faster, compiled languages.

## How to access content

- **Markdown version:** Request \`https://rewrites.bio/\` with \`Accept: text/markdown\` or \`Accept: text/plain\`
- **Direct markdown:** \`https://rewrites.bio/manifesto.md\`
- **HTML version:** \`https://rewrites.bio/\` (default)

## Docs

- [The Manifesto](https://rewrites.bio/manifesto.md): The full set of ${totalPrinciples} principles across ${manifesto.sections.length} sections (${manifesto.sections.map((s) => s.title).join(", ")})
`;

writeFileSync("public/.well-known/agent.md", agentMd);

console.log(
  "Generated: public/index.md, public/manifesto.md, public/.well-known/agent.md",
);
