import type { Context } from "https://edge.netlify.com";

/**
 * Netlify Edge Function that serves markdown versions of pages
 * when the client sends an Accept header preferring text/markdown.
 *
 * This allows LLM agents and CLI tools to get clean markdown
 * by requesting: curl -H "Accept: text/markdown" https://riir.bio/
 */
export default async function handler(
  request: Request,
  context: Context,
): Promise<Response | void> {
  const accept = request.headers.get("accept") || "";
  const url = new URL(request.url);

  // Map HTML pages to their markdown equivalents
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const mdMap: Record<string, string> = {
    "/": "/manifesto.md",
    "/projects": "/projects.md",
  };

  const mdPath = mdMap[pathname];
  if (!mdPath) {
    return; // Not a page with a markdown version
  }

  // Check if the client prefers markdown/plain text over HTML
  const preferredType = preferredMarkdownType(accept);

  if (!preferredType) {
    return; // Serve normal HTML
  }

  // Fetch the markdown file from the same origin
  const mdUrl = new URL(mdPath, url.origin);
  const mdResponse = await fetch(mdUrl.toString());

  if (!mdResponse.ok) {
    return; // Markdown file not found, fall through to HTML
  }

  const mdContent = await mdResponse.text();

  return new Response(mdContent, {
    status: 200,
    headers: {
      "content-type": `${preferredType}; charset=utf-8`,
      "cache-control": "public, max-age=3600",
      "vary": "Accept",
      "x-content-source": "markdown",
    },
  });
}

/**
 * Check if the Accept header prefers text/markdown or text/plain over text/html.
 *
 * Returns the preferred content type ("text/markdown" or "text/plain") if the
 * client wants markdown, or null if the client prefers HTML.
 *
 * Serves markdown when:
 *  - text/markdown or text/plain is present and text/html is NOT
 *  - text/markdown or text/plain has higher q-value than text/html
 *  - Equal q-values: whichever appeared first wins
 */
function preferredMarkdownType(accept: string): string | null {
  if (!accept) return null;

  // Exact match for common agent patterns
  if (accept === "text/markdown") return "text/markdown";
  if (accept === "text/plain") return "text/plain";

  const types = accept.split(",").map((t) => {
    const parts = t.trim().split(";");
    const mediaType = parts[0].trim().toLowerCase();
    let q = 1.0;
    for (const param of parts.slice(1)) {
      const [key, val] = param.trim().split("=");
      if (key.trim() === "q" && val) {
        q = parseFloat(val);
          if (isNaN(q)) q = 1.0;
      }
    }
    return { mediaType, q };
  });

  const mdEntry = types.find(
    (t) => t.mediaType === "text/markdown" || t.mediaType === "text/plain",
  );
  const htmlEntry = types.find(
    (t) => t.mediaType === "text/html" || t.mediaType === "application/xhtml+xml",
  );

  if (!mdEntry) return null;
  if (!htmlEntry) return mdEntry.mediaType; // Wants markdown/plain, doesn't mention HTML

  // Compare q-values
  if (mdEntry.q > htmlEntry.q) return mdEntry.mediaType;
  if (mdEntry.q < htmlEntry.q) return null;

  // Equal q-values: whichever appeared first in the Accept header wins
  const mdIndex = types.indexOf(mdEntry);
  const htmlIndex = types.indexOf(htmlEntry);
  return mdIndex < htmlIndex ? mdEntry.mediaType : null;
}

export const config = {
  path: ["/", "/projects"],
};
