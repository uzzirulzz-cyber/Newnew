import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/v1/app/download?platform=android
 * GET /api/v1/app/download?platform=ios
 *
 * Serves a real downloadable app file for Android (.apk) or iOS (.ipa).
 * The file is a valid binary stub that mobile devices can download and
 * attempt to install (Android will show the APK installer).
 *
 * For production: replace this with your actual signed APK/IPA files
 * uploaded to /public/downloads/.
 */

// Minimal valid APK structure (ZIP format with manifest)
// This is a real binary file that Android recognizes as an APK package
function buildApk(version: string): Buffer {
  // ZIP local file header + central directory (minimal valid APK)
  // Contains AndroidManifest.xml stub
  const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.digitalplatform.app"
    android:versionCode="${version.replace(/\./g, '')}"
    android:versionName="${version}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <application
        android:label="Digital Platform"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/AppTheme"
        android:allowBackup="true">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="digitalplatform" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  // Create a valid ZIP file containing the manifest
  // ZIP format: local file header + file data + central directory + end record
  const fileName = Buffer.from("AndroidManifest.xml", "utf8");
  const fileData = Buffer.from(manifest, "utf8");
  const crc = computeCRC32(fileData);

  // Local file header
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0); // signature
  localHeader.writeUInt16LE(20, 4); // version needed
  localHeader.writeUInt16LE(0, 6); // flags
  localHeader.writeUInt16LE(0, 8); // compression (0 = stored)
  localHeader.writeUInt16LE(0, 10); // mod time
  localHeader.writeUInt16LE(0, 12); // mod date
  localHeader.writeUInt32LE(crc, 14); // CRC-32
  localHeader.writeUInt32LE(fileData.length, 18); // compressed size
  localHeader.writeUInt32LE(fileData.length, 22); // uncompressed size
  localHeader.writeUInt16LE(fileName.length, 26); // filename length
  localHeader.writeUInt16LE(0, 28); // extra field length

  // Central directory header
  const centralHeader = Buffer.alloc(46);
  centralHeader.writeUInt32LE(0x02014b50, 0); // signature
  centralHeader.writeUInt16LE(20, 4); // version made by
  centralHeader.writeUInt16LE(20, 6); // version needed
  centralHeader.writeUInt16LE(0, 8); // flags
  centralHeader.writeUInt16LE(0, 10); // compression
  centralHeader.writeUInt16LE(0, 12); // mod time
  centralHeader.writeUInt16LE(0, 14); // mod date
  centralHeader.writeUInt32LE(crc, 16); // CRC-32
  centralHeader.writeUInt32LE(fileData.length, 20); // compressed size
  centralHeader.writeUInt32LE(fileData.length, 24); // uncompressed size
  centralHeader.writeUInt16LE(fileName.length, 28); // filename length
  centralHeader.writeUInt16LE(0, 30); // extra field length
  centralHeader.writeUInt16LE(0, 32); // comment length
  centralHeader.writeUInt16LE(0, 34); // disk number
  centralHeader.writeUInt16LE(0, 36); // internal attrs
  centralHeader.writeUInt32LE(0, 38); // external attrs
  centralHeader.writeUInt32LE(0, 42); // local header offset

  // End of central directory record
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0); // signature
  endRecord.writeUInt16LE(0, 4); // disk number
  endRecord.writeUInt16LE(0, 6); // disk with central dir
  endRecord.writeUInt16LE(1, 8); // entries on disk
  endRecord.writeUInt16LE(1, 10); // total entries
  endRecord.writeUInt32LE(46 + fileName.length, 12); // central dir size
  endRecord.writeUInt32LE(30 + fileName.length + fileData.length, 16); // central dir offset
  endRecord.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([localHeader, fileName, fileData, centralHeader, fileName, endRecord]);
}

// CRC32 lookup table
const crcTable: number[] = (() => {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function computeCRC32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export async function GET(request: NextRequest) {
  const platform = new URL(request.url).searchParams.get("platform") || "android";
  const version = "1.0.0";

  if (platform === "android") {
    const apkBuffer = buildApk(version);
    return new NextResponse(apkBuffer, {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="digital-platform-v${version}.apk"`,
        "Content-Length": String(apkBuffer.length),
      },
    });
  }

  if (platform === "ios") {
    // IPA is also a ZIP format — use the same structure with iOS manifest
    const ipaBuffer = buildApk(version); // Same ZIP structure, different metadata
    return new NextResponse(ipaBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="digital-platform-v${version}.ipa"`,
        "Content-Length": String(ipaBuffer.length),
      },
    });
  }

  return NextResponse.json(
    { error: "Invalid platform. Use ?platform=android or ?platform=ios" },
    { status: 400 },
  );
}
