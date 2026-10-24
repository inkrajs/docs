import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Reproducible local demo derived only from the repository's public artwork.
const source = fileURLToPath(new URL('../src/assets/inkra.png', import.meta.url));
const output = new URL('../public/media/inkra-artwork.webm', import.meta.url);
mkdirSync(new URL('.', output), { recursive: true });
const result = spawnSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-i', source,
  '-filter_complex', "[0:v]scale=360:360[art];color=c=0xf4f0e3:s=640x360:r=15[paper];[paper][art]overlay=(W-w)/2:(H-h)/2,zoompan=z='min(1+on/900,1.1)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=90:s=640x360:fps=15",
  '-t', '6', '-an', '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0',
  '-pix_fmt', 'yuv420p', '-threads', '1', fileURLToPath(output),
], { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
