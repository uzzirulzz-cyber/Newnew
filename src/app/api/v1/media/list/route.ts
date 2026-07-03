import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import fs from "fs/promises";
import path from "path";

/**
 * GET /api/v1/media/list
 *
 * Lists all uploaded media files from /public/uploads/.
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;

  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const folders = await fs.readdir(uploadsDir).catch(() => []);

    const files: Array<{
      name: string;
      url: string;
      size: number;
      folder: string;
      type: string;
      modified: string;
    }> = [];

    for (const folder of folders) {
      const folderPath = path.join(uploadsDir, folder);
      const stat = await fs.stat(folderPath).catch(() => null);
      if (!stat || !stat.isDirectory()) continue;

      const folderFiles = await fs.readdir(folderPath).catch(() => []);
      for (const fileName of folderFiles) {
        const filePath = path.join(folderPath, fileName);
        const fileStat = await fs.stat(filePath).catch(() => null);
        if (!fileStat) continue;

        const ext = path.extname(fileName).toLowerCase();
        let type = "file";
        if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) type = "image";
        else if ([".mp4", ".webm", ".mov", ".avi"].includes(ext)) type = "video";
        else if ([".pdf"].includes(ext)) type = "pdf";
        else if ([".doc", ".docx", ".txt"].includes(ext)) type = "document";

        files.push({
          name: fileName,
          url: `/uploads/${folder}/${fileName}`,
          size: fileStat.size,
          folder,
          type,
          modified: fileStat.mtime.toISOString(),
        });
      }
    }

    // Sort by modified date (newest first)
    files.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    // Calculate storage stats
    const totalSize = files.reduce((s, f) => s + f.size, 0);
    const folderCounts = folders.reduce(
      (acc, f) => {
        acc[f] = files.filter((file) => file.folder === f).length;
        return acc;
      },
      {} as Record<string, number>,
    );

    return ok({
      files,
      total: files.length,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      folders: folders.map((f) => ({ name: f, count: folderCounts[f] || 0 })),
    });
  } catch (e) {
    console.error("[media-list] error:", e);
    return ok({ files: [], total: 0, totalSize: 0, folders: [] });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
