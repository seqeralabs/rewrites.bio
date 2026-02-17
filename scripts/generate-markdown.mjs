import { readFileSync, writeFileSync, copyFileSync } from "fs";
import { parse } from "yaml";

const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

const manifesto = parse(readFileSync("src/data/manifesto.yaml", "utf-8"));

// Generate manifesto markdown
let md = `# rewrites.bio - Rewrite it, for Bioinformatics

> Rewriting bioinformatics tools with AI. Responsibly.

AI coding assistants have made it possible to rewrite established bioinformatics tools in compiled languages like Rust, often in days rather than months. This is a manifesto for doing it well.

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
