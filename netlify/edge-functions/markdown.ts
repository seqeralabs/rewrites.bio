import type { Context } from "@netlify/edge-functions";

/**
 * Serves markdown when the client prefers text/markdown over HTML.
 * Enables: curl -H "Accept: text/markdown" https://rewrites.bio/
 */
export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  if (url.pathname !== "/") {
    return context.next();
  }

  const accept = request.headers.get("Accept") ?? "";
  const preferredType = preferredMarkdownType(accept);
  if (!preferredType) {
    return context.next();
  }

  const response = await context.rewrite("/manifesto.md");
  if (!response.ok) {
    return context.next();
  }

  const body = await response.text();
  const tokenCount = Math.ceil(body.length / 4);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": `${preferredType}; charset=utf-8`,
      "x-markdown-tokens": String(tokenCount),
      "x-content-source": "markdown",
      Vary: "Accept",
    },
  });
};

/**
 * Returns the preferred markdown content type when the Accept header
 * prefers text/markdown or text/plain over text/html.
 */
function preferredMarkdownType(accept: string): string | null {
  if (!accept) return null;

  if (accept === "text/markdown") return "text/markdown";
  if (accept === "text/plain") return "text/plain";

  const types = accept.split(",").map((entry) => {
    const parts = entry.trim().split(";");
    const mediaType = parts[0].trim().toLowerCase();
    let q = 1.0;
    for (const param of parts.slice(1)) {
      const [key, val] = param.trim().split("=");
      if (key.trim() === "q" && val) {
        const parsed = parseFloat(val);
        if (!Number.isNaN(parsed)) q = parsed;
      }
    }
    return { mediaType, q };
  });

  const mdEntry = types.find(
    (t) => t.mediaType === "text/markdown" || t.mediaType === "text/plain",
  );
  const htmlEntry = types.find(
    (t) =>
      t.mediaType === "text/html" || t.mediaType === "application/xhtml+xml",
  );

  if (!mdEntry) return null;
  if (!htmlEntry) return mdEntry.mediaType;

  if (mdEntry.q > htmlEntry.q) return mdEntry.mediaType;
  if (mdEntry.q < htmlEntry.q) return null;

  const mdIndex = types.indexOf(mdEntry);
  const htmlIndex = types.indexOf(htmlEntry);
  return mdIndex < htmlIndex ? mdEntry.mediaType : null;
}
