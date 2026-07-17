const path = require('path');
const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');

const YTDLP_VERSION = 'latest';

const PLATFORM_URLS = {
  win32: {
    ytDlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
    ffmpeg: 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v4.4.1/ffmpeg-4.4.1-win-64.zip',
    ffprobe: 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v4.4.1/ffprobe-4.4.1-win-64.zip'
  },
  linux: {
    ytDlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
    ffmpeg: null, // handled via yt-dlp --ffmpeg-location or system install
    ffprobe: null
  },
  darwin: {
    ytDlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
    ffmpeg: null,
    ffprobe: null
  }
};

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    let receivedBytes = 0;

    https.get(url, (response) => {
      // Follow redirect (GitHub sends 302)
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.destroy();
        file.close();
        fs.unlinkSync(destPath);
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.destroy();
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`Download failed: HTTP ${response.statusCode} for ${url}`));
        return;
      }

      const total = parseInt(response.headers['content-length'], 10) || 0;
      response.on('data', (chunk) => {
        receivedBytes += chunk.length;
        file.write(chunk);
      });
      response.on('end', () => {
        file.end();
        resolve();
      });
      response.on('error', (err) => {
        file.close();
        fs.unlinkSync(destPath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      try { fs.unlinkSync(destPath); } catch (e) {}
      reject(err);
    });
  });
}

function extractZip(zipPath, extractDir) {
  return new Promise((resolve, reject) => {
    const psCmd = `
      Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force
    `;
    const child = spawn('powershell', ['-NoProfile', '-Command', psCmd], { stdio: 'pipe', timeout: 120000 });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      try { fs.unlinkSync(zipPath); } catch (e) {}
      if (code === 0) resolve();
      else reject(new Error(`Extract failed (code ${code}): ${stderr}`));
    });
    child.on('error', reject);
  });
}

async function ensureYtDlp(binDir) {
  const urls = PLATFORM_URLS[process.platform];
  if (!urls) {
    console.log(`[bin-downloader] Unsupported platform: ${process.platform}`);
    return false;
  }

  const isWin = process.platform === 'win32';
  const ytDlpPath = path.join(binDir, isWin ? 'yt-dlp.exe' : 'yt-dlp');
  const ffmpegPath = path.join(binDir, isWin ? 'ffmpeg.exe' : 'ffmpeg');
  const ffprobePath = path.join(binDir, isWin ? 'ffprobe.exe' : 'ffprobe');

  try {
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    // Check existing yt-dlp works
    let ytDlpValid = false;
    if (fs.existsSync(ytDlpPath)) {
      try {
        const versionCheck = spawn(ytDlpPath, ['--version'], { stdio: 'pipe', timeout: 10000 });
        const versionOut = await new Promise((res, rej) => {
          let out = '';
          versionCheck.stdout.on('data', (d) => { out += d.toString(); });
          versionCheck.on('close', (c) => c === 0 ? res(out.trim()) : rej(new Error(`exit ${c}`)));
          versionCheck.on('error', rej);
        });
        if (versionOut) {
          console.log(`[bin-downloader] yt-dlp ${versionOut} already present`);
          ytDlpValid = true;
        }
      } catch (e) {
        console.log(`[bin-downloader] yt-dlp binary broken, re-downloading...`);
        try { fs.unlinkSync(ytDlpPath); } catch (u) {}
      }
    }

    if (!ytDlpValid) {
      console.log(`[bin-downloader] Downloading yt-dlp from ${urls.ytDlp}...`);
      const tmpPath = ytDlpPath + '.tmp';
      await downloadFile(urls.ytDlp, tmpPath);
      fs.renameSync(tmpPath, ytDlpPath);
      if (!isWin) {
        fs.chmodSync(ytDlpPath, 0o755);
      }
      console.log(`[bin-downloader] yt-dlp downloaded to ${ytDlpPath}`);
    }

    // Windows: download ffmpeg + ffprobe in parallel
    if (isWin) {
      const dlTasks = [];
      if (urls.ffmpeg && !fs.existsSync(ffmpegPath)) {
        console.log(`[bin-downloader] Downloading ffmpeg...`);
        dlTasks.push((async () => {
          const zipPath = path.join(binDir, 'ffmpeg.zip');
          await downloadFile(urls.ffmpeg, zipPath);
          await extractZip(zipPath, binDir);
          console.log(`[bin-downloader] ffmpeg installed`);
        })());
      }
      if (urls.ffprobe && !fs.existsSync(ffprobePath)) {
        console.log(`[bin-downloader] Downloading ffprobe...`);
        dlTasks.push((async () => {
          const zipPath = path.join(binDir, 'ffprobe.zip');
          await downloadFile(urls.ffprobe, zipPath);
          await extractZip(zipPath, binDir);
          console.log(`[bin-downloader] ffprobe installed`);
        })());
      }
      await Promise.all(dlTasks);
    }

    return true;
  } catch (err) {
    console.error(`[bin-downloader] Failed: ${err.message}`);
    return false;
  }
}

// Wrapper with timeout so startup never hangs on download/extract
async function ensureYtDlpSafe(binDir, timeoutMs = 180000) {
  const timer = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), timeoutMs)
  );
  try {
    return await Promise.race([ensureYtDlp(binDir), timer]);
  } catch (err) {
    console.error(`[bin-downloader] Timed out or failed (${err.message}), continuing without binaries`);
    return false;
  }
}

module.exports = { ensureYtDlp, ensureYtDlpSafe };
