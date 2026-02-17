import { readFileSync, writeFileSync, copyFileSync } from "fs";
import { parse } from "yaml";

const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

const manifesto = parse(readFileSync("src/data/manifesto.yaml", "utf-8"));

// Generate manifesto markdown
let md = `# rewrites.bio - Rewrite it, for Bioinformatics

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

console.log("Generated: public/index.md, public/manifesto.md");
