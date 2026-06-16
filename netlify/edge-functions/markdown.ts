import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  if (url.pathname !== "/") {
    return context.next();
  }

  const accept = request.headers.get("Accept") ?? "";
  if (!accept.includes("text/markdown")) {
    return context.next();
  }

  const response = await context.rewrite("/manifesto.md");
  const body = await response.text();
  const tokenCount = Math.ceil(body.length / 4);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "x-markdown-tokens": String(tokenCount),
      Vary: "Accept",
    },
  });
};
