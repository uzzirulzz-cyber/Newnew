import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json([]);
}
export async function POST() {
  return NextResponse.json({ id: "item-1", quantity: 1 }, { status: 201 });
}
export async function DELETE() {
  return new NextResponse(null, { status: 204 });
}
