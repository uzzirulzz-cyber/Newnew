import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Authorize Application</title></head><body><h1>PlayBeat Digital — Authorize Application</h1><p>This application requests access to your store via WooCommerce REST API.</p><a href="/">Back to Store</a></body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
