/**
 * Post-build script: generates markdown and agent discovery artifacts from dist/index.html.
 *
 * Strips visuals, navigation, and decorative elements, then converts the
 * remaining content HTML to clean markdown for LLM consumption.
 *
 * Output:
 *   dist/index.md
 *   dist/manifesto.md        (copy)
 *   dist/.well-known/agent.md
 *   dist/.well-known/api-catalog
 *   dist/.well-known/agent-skills/index.json
 *   dist/.well-known/mcp/server-card.json
 *
 * Note: dist/auth.md is a static file served straight from public/auth.md.
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import TurndownService from "turndown";

const root = join(import.meta.dirname, "..");
const siteUrl = process.env.URL || "https://rewrites.bio";

function distPath(filename) {
  return join(root, "dist", filename);
}

function sha256Digest(content) {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

let html = readFileSync(distPath("index.html"), "utf-8");

// The <title> leaks into turndown output; strip the entire <head> upfront
html = html.replace(/<head[\s>][\s\S]*?<\/head>/i, "");

function hasClass(node, cls) {
  return node?.classList?.contains(cls) ?? false;
}

function hasAnyClass(node, classes) {
  return classes.some((c) => hasClass(node, c));
}

function textOf(node, selector) {
  return node.querySelector(selector)?.textContent?.trim() || "";
}

const stripClasses = [
  "site-nav",
  "toc-sidebar",
  "site-footer",
  "nav-toc-toggle",
  "principle-visual",
  "preamble-visual",
  "anchor-link",
  "hero-rule",
  "closing-line",
  "hero-seqera-link",
  "hero-pre",
];

function createTurndown() {
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    hr: "---",
    emDelimiter: "*",
    strongDelimiter: "**",
  });
  td.remove(["style", "script", "svg", "button"]);
  td.addRule("stripByClass", {
    filter: (node) => hasAnyClass(node, stripClasses),
    replacement: () => "",
  });
  return td;
}

// Plain instance for converting inner HTML fragments (descriptions, attribution).
// Separate from the main instance so structural rules (principleArticle, etc.)
// don't fire on inner fragments.
const turndownDesc = createTurndown();

const turndown = createTurndown();

turndown.addRule("heroTitle", {
  filter: (node) => node.nodeName === "H1" && hasClass(node, "hero-title"),
  replacement: (content) => `# ${content.replace(/\s+/g, "")}\n\n`,
});

turndown.addRule("heroTagline", {
  filter: (node) => hasClass(node, "hero-tagline"),
  replacement: (content) => `> ${content.trim()}\n\n`,
});

turndown.addRule("heroIntro", {
  filter: (node) => hasClass(node, "hero-intro"),
  replacement: (content) => `${content.trim()}\n\n`,
});

turndown.addRule("preambleHeader", {
  filter: (node) => hasClass(node, "preamble-header"),
  replacement: (_content, node) => {
    return `## ${textOf(node, ".preamble-number")}. ${textOf(node, ".preamble-title")}\n\n`;
  },
});

turndown.addRule("preambleHeading", {
  filter: (node) =>
    (node.nodeName === "A" || node.nodeName === "H3") &&
    hasClass(node, "preamble-heading"),
  replacement: (_content, node) => {
    const num = textOf(node, ".preamble-sub-number");
    let title = "";
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        title += child.textContent;
      } else if (
        child.nodeType === 1 &&
        !hasAnyClass(child, ["preamble-sub-number", "anchor-link"])
      ) {
        title += child.textContent;
      }
    }
    return `### ${num} ${title.trim()}\n\n`;
  },
});

turndown.addRule("callout", {
  filter: (node) => hasClass(node, "preamble-callout"),
  replacement: (content) => {
    const lines = content
      .trim()
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => `> *${l.trim()}*`);
    return lines.join("\n") + "\n\n";
  },
});

turndown.addRule("preambleClosing", {
  filter: (node) => hasClass(node, "preamble-closing"),
  replacement: (content) => `${content.trim()}\n\n---\n\n`,
});

turndown.addRule("sectionHeaderWrap", {
  filter: (node) => hasClass(node, "section-header-wrap"),
  replacement: (_content, node) => {
    const num = textOf(node, ".section-number");
    const title = textOf(node, ".section-title").replace(/#$/, "").trim();
    const intro = textOf(node, ".section-intro");
    let md = `## ${num}. ${title}\n\n`;
    if (intro) md += `${intro}\n\n`;
    return md;
  },
});

turndown.addRule("principleArticle", {
  filter: (node) => node.nodeName === "ARTICLE" && hasClass(node, "principle"),
  replacement: (_content, node) => {
    const num = textOf(node, ".principle-number");
    const title = textOf(node, ".principle-title");
    const descEl = node.querySelector(".principle-desc");
    const desc = descEl ? turndownDesc.turndown(descEl.innerHTML) : "";
    return `### ${num} ${title}\n\n${desc}\n\n`;
  },
});

turndown.addRule("closingSection", {
  filter: (node) => hasClass(node, "closing"),
  replacement: (_content, node) => {
    const text = textOf(node, ".closing-text");
    const body = textOf(node, ".closing-body");
    const attr = node.querySelector(".closing-attribution");
    const attrMd = attr ? turndownDesc.turndown(attr.innerHTML).trim() : "";
    let md = "---\n\n";
    if (text) md += `*${text}*\n\n`;
    if (body) md += `${body}\n\n`;
    if (attrMd) md += `${attrMd}\n`;
    return md;
  },
});

turndown.addRule("sectionContent", {
  filter: (node) => hasClass(node, "section-content"),
  replacement: (content) => content,
});

turndown.addRule("manifestoSection", {
  filter: (node) => node.nodeName === "SECTION" && hasClass(node, "manifesto-section"),
  replacement: (content) => content,
});

let md = turndown.turndown(html);

md = md.replace(/\n{3,}/g, "\n\n");
md = md.replace(/^-   /gm, "- ");
md = md.replace(/\s*data-astro-cid-\w+="?[^"\s]*"?/g, "");
md = md.trim();

// Use the last git commit date of the content source, not the build date
const updated = execSync("git log -1 --format=%cs -- src/pages/index.astro src/components/", {
  cwd: root,
  encoding: "utf-8",
}).trim() || new Date().toISOString().split("T")[0];

const frontmatter = `---
title: rewrites.bio
description: Principles for AI-assisted rewrites of bioinformatics tools
url: ${siteUrl}
source: https://github.com/seqeralabs/rewrites.bio
updated: ${updated}
---`;

const footer = `\n\n---\n\nWebsite: [rewrites.bio](${siteUrl})\nSource: [github.com/seqeralabs/rewrites.bio](https://github.com/seqeralabs/rewrites.bio)\n`;

md = frontmatter + "\n\n" + md + footer;

writeFileSync(distPath("index.md"), md);
copyFileSync(distPath("index.md"), distPath("manifesto.md"));

mkdirSync(join(root, "dist", ".well-known"), { recursive: true });
mkdirSync(join(root, "dist", ".well-known", "agent-skills"), { recursive: true });
mkdirSync(join(root, "dist", ".well-known", "mcp"), { recursive: true });

const agentMd = `---
purpose: Context and instructions for AI agents
url: ${siteUrl}
version: 1.0
updated: ${updated}
---

# rewrites.bio

> Rewriting bioinformatics tools with AI. Responsibly.

## What this is

rewrites.bio is a manifesto defining principles for the responsible AI-assisted rewriting of established bioinformatics tools in faster, compiled languages.

## How to access content

- **Markdown version:** \`${siteUrl}/manifesto.md\` (preferred for agents)
- **HTML version:** \`${siteUrl}/\` (default for browsers)
- **LLM index:** \`${siteUrl}/llms.txt\`
- **Agent skills:** \`${siteUrl}/.well-known/agent-skills/index.json\`
- **API catalog:** \`${siteUrl}/.well-known/api-catalog\`

## Content negotiation

Send \`Accept: text/markdown\` to \`${siteUrl}/\` to receive the manifesto as markdown.
`;

writeFileSync(distPath(".well-known/agent.md"), agentMd);

const apiCatalog = {
  linkset: [
    {
      anchor: `${siteUrl}/.well-known/api-catalog`,
      item: [
        { href: `${siteUrl}/` },
      ],
    },
    {
      anchor: `${siteUrl}/`,
      "service-desc": [
        {
          href: `${siteUrl}/manifesto.md`,
          type: "text/markdown",
        },
      ],
      "service-doc": [
        {
          href: `${siteUrl}/manifesto.md`,
          type: "text/markdown",
        },
      ],
      status: [
        {
          href: `${siteUrl}/`,
        },
      ],
    },
  ],
};

writeFileSync(
  distPath(".well-known/api-catalog"),
  JSON.stringify(apiCatalog, null, 2),
);

const skillsDir = join(root, "public", ".well-known", "agent-skills");
const skillEntries = readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const skillPath = join(skillsDir, entry.name, "SKILL.md");
    const content = readFileSync(skillPath, "utf-8");
    const firstParagraph = content
      .split("\n\n")
      .slice(1)
      .find((block) => block.trim() && !block.startsWith("#"))
      ?.trim() ?? "";
    return {
      name: entry.name,
      type: "skill-md",
      description: firstParagraph.split("\n")[0],
      url: `${siteUrl}/.well-known/agent-skills/${entry.name}/SKILL.md`,
      digest: sha256Digest(content),
    };
  });

const agentSkillsIndex = {
  $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
  skills: skillEntries,
};

writeFileSync(
  distPath(".well-known/agent-skills/index.json"),
  JSON.stringify(agentSkillsIndex, null, 2),
);

const mcpServerCard = {
  serverInfo: {
    name: "rewrites.bio",
    version: "1.0.0",
  },
  endpoint: `${siteUrl}/`,
  transport: {
    type: "webmcp",
    description: "Browser-based tools via WebMCP on the homepage",
  },
  capabilities: {
    resources: {
      listChanged: false,
    },
    tools: {
      listChanged: false,
    },
  },
  resources: [
    {
      uri: `${siteUrl}/manifesto.md`,
      name: "manifesto",
      description: "Full manifesto in markdown",
      mimeType: "text/markdown",
    },
    {
      uri: `${siteUrl}/.well-known/agent.md`,
      name: "agent-instructions",
      description: "Agent discovery and usage instructions",
      mimeType: "text/markdown",
    },
    {
      uri: `${siteUrl}/llms.txt`,
      name: "llms-index",
      description: "LLM-friendly site index",
      mimeType: "text/plain",
    },
  ],
};

writeFileSync(
  distPath(".well-known/mcp/server-card.json"),
  JSON.stringify(mcpServerCard, null, 2),
);

// Mirror sitemap-0.xml as /sitemap.xml for scanners expecting that path
const sitemap0Path = distPath("sitemap-0.xml");
try {
  writeFileSync(distPath("sitemap.xml"), readFileSync(sitemap0Path, "utf-8"));
} catch {
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}/</loc><lastmod>${updated}</lastmod></url>
</urlset>`;
  writeFileSync(distPath("sitemap.xml"), sitemapXml);
}

console.log(
  "Generated: dist/index.md, dist/manifesto.md, " +
    "dist/.well-known/agent.md, dist/.well-known/api-catalog, " +
    "dist/.well-known/agent-skills/index.json, dist/.well-known/mcp/server-card.json",
);
