import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function editLogo(inputPath: string, outputPath: string, size: '1440x720' | '1024x1024') {
  const b64 = fs.readFileSync(inputPath).toString('base64');
  const dataUrl = `data:image/png;base64,${b64}`;
  const zai = await ZAI.create();
  const response = await zai.images.generations.edit({
    prompt: 'Keep the logo design EXACTLY as is — same colors, layout, fonts, play button icon, soundwave bars. ONLY make the background fully transparent (alpha = 0). Output PNG with alpha channel. Do NOT alter or restyle the logo.',
    images: [{ url: dataUrl }],
    size,
  });
  const out = response.data[0].base64;
  fs.writeFileSync(outputPath, Buffer.from(out, 'base64'));
  console.log(`✓ Saved ${outputPath}`);
}

async function main() {
  // Wide PLAYBEAT wordmark logo → 1440x720 (wide landscape)
  await editLogo(
    '/home/z/my-project/upload/ChatGPT Image Jul 6, 2026, 08_01_00 AM.png',
    '/home/z/my-project/public/logo-wide.png',
    '1440x720'
  );
  // Square playbeat logo → 1024x1024
  await editLogo(
    '/home/z/my-project/upload/ChatGPT Image Jul 2, 2026, 04_50_54 AM.png',
    '/home/z/my-project/public/logo-square.png',
    '1024x1024'
  );
}
main().catch(e => { console.error(e); process.exit(1); });
