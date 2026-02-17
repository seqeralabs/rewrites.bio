import { readFileSync, writeFileSync, copyFileSync } from "fs";
import { parse } from "yaml";

const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

const manifesto = parse(readFileSync("src/data/manifesto.yaml", "utf-8"));
const projects = parse(readFileSync("src/data/projects.yaml", "utf-8"));

// Generate manifesto markdown
let md = `# RiiR.bio - Rewrite it in Rust, for Bioinformatics

> Rewrite it in Rust. Responsibly.

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

Website: [riir.bio](https://riir.bio)
Source: [github.com/ewels/riir.bio](https://github.com/ewels/riir.bio)
`;

writeFileSync("public/index.md", md);
copyFileSync("public/index.md", "public/manifesto.md");

// Generate projects markdown
let pmd = `# RiiR.bio - Projects

Bioinformatics tools that have been responsibly rewritten in Rust, following the principles of the RiiR.bio manifesto.

---

## Rust Rewrites

`;

for (const project of projects.rewrites) {
  pmd += `### ${project.name}\n\n${project.description}\n`;
  if (project.replaces) pmd += `- **Replaces:** ${project.replaces}\n`;
  pmd += `- **GitHub:** [${project.url}](${project.url})\n`;
  if (project.paper) pmd += `- **Paper:** [${project.paper}](${project.paper})\n`;
  pmd += "\n";
}

pmd += `---

## Rust Libraries & Frameworks

`;

for (const lib of projects.libraries) {
  pmd += `### ${lib.name}\n\n${lib.description}\n`;
  pmd += `- **GitHub:** [${lib.url}](${lib.url})\n`;
  if (lib.paper) pmd += `- **Paper:** [${lib.paper}](${lib.paper})\n`;
  pmd += "\n";
}

pmd += `---

Know a project that belongs here? [Open an issue](https://github.com/ewels/riir.bio/issues) or [submit a PR](https://github.com/ewels/riir.bio/pulls).

Website: [riir.bio/projects](https://riir.bio/projects)
Source: [github.com/ewels/riir.bio](https://github.com/ewels/riir.bio)
`;

writeFileSync("public/projects.md", pmd);

console.log("Generated: public/index.md, public/manifesto.md, public/projects.md");
