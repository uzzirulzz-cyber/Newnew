import { NextRequest } from "next/server";
import { ok, error } from "@/lib/api";
import fs from "fs";
import path from "path";

/**
 * GET /api/v1/admin/restore-point
 *
 * Lists all available database restore points. Each restore point is a
 * directory under /home/z/my-project/db-restore-point/ containing JSON
 * snapshots of all critical tables.
 *
 * Returns: { restorePoints: [{ id, timestamp, description, tables, totalRecords }] }
 */
export async function GET(request: NextRequest) {
  const restoreDir = "/home/z/my-project/db-restore-point";

  if (!fs.existsSync(restoreDir)) {
    return ok({ restorePoints: [], message: "No restore points directory found" });
  }

  const dirs = fs.readdirSync(restoreDir).filter(d => {
    const stat = fs.statSync(path.join(restoreDir, d));
    return stat.isDirectory();
  });

  const restorePoints = dirs.map(id => {
    const manifestPath = path.join(restoreDir, id, "manifest.json");
    if (!fs.existsSync(manifestPath)) return null;
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const tables = manifest.tables || {};
      const totalRecords = Object.values(tables).reduce(
        (s: number, t: any) => s + (t.count || 0),
        0,
      );
      return {
        id,
        timestamp: manifest.timestamp,
        description: manifest.description || "No description",
        tableCount: Object.keys(tables).length,
        totalRecords,
        tables,
      };
    } catch {
      return null;
    }
  }).filter(Boolean);

  // Sort newest first
  restorePoints.sort((a: any, b: any) => b.id.localeCompare(a.id));

  return ok({
    restorePoints,
    count: restorePoints.length,
    defaultRestorePoint: restorePoints[0]?.id || null,
  });
}
