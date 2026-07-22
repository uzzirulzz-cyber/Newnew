import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const cats = await db.category.findMany();
  const result = cats.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: 0,
    image: null,
    parent: 0,
  }));
  return NextResponse.json(result);
}
