const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG_PATH = path.join(__dirname, '..', 'bin', 'ffmpeg');
const AUDIO_PATH = path.join(__dirname, '..', 'master_soundtrack_slash_commands_80s.wav');
const OUTPUT_MP4 = path.join(__dirname, '..', 'videos', 'Antigravity十大神級指令全攻略_80s_直式手機版.mp4');
const HTML_PATH = 'file://' + path.join(__dirname, '..', 'src', 'index_slash_commands_portrait_80s.html');

const FPS = 30;
const DURATION_SEC = 80;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 2400 frames
const BATCH_SIZE = 40; // 40 frames per roundtrip

async function main() {
  console.log('========================================================');
  console.log('⚡ Antigravity 十大斜線神指令全攻略 · 直式手機版 (9:16) 渲染器');
  console.log(`規格: 1080x1920 @ ${FPS} FPS | 總時長: ${DURATION_SEC} 秒 (${TOTAL_FRAMES} 幀)`);
  console.log(`音訊來源: ${AUDIO_PATH}`);
  console.log(`輸出影片: ${OUTPUT_MP4}`);
  console.log('========================================================\n');

  if (!fs.existsSync(AUDIO_PATH)) {
    console.error('❌ 找不到音樂檔 master_soundtrack_slash_commands_80s.wav');
    process.exit(1);
  }

  const videosDir = path.dirname(OUTPUT_MP4);
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  // 1. Launch FFmpeg process
  console.log('🚀 啟動 FFmpeg 直式轉碼管線 (H.264 High 4.1 + yuv420p + faststart + AAC)...');
  const ffmpeg = spawn(FFMPEG_PATH, [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', String(FPS),
    '-i', 'pipe:0',
    '-i', AUDIO_PATH,
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-level:v', '4.1',
    '-preset', 'fast',
    '-crf', '19',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '44100',
    '-shortest',
    '-movflags', '+faststart',
    OUTPUT_MP4
  ], {
    stdio: ['pipe', 'inherit', 'inherit']
  });

  ffmpeg.on('error', (err) => {
    console.error('FFmpeg 錯誤:', err);
  });

  // 2. Launch Headless Chrome
  console.log('🌐 啟動 Headless Chrome 渲染核心 (1080x1920)...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas=false',
      '--enable-gpu-rasterization'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.goto(HTML_PATH, { waitUntil: 'load' });

  // Wait 1.5s for fonts
  await new Promise(r => setTimeout(r, 1500));

  console.log('🎨 開始逐幀渲染 9:16 直式 Canvas 10 大斜線指令動態圖表...');
  const startTime = Date.now();
  let renderedFrames = 0;

  for (let batchStart = 0; batchStart < TOTAL_FRAMES; batchStart += BATCH_SIZE) {
    const batchCount = Math.min(BATCH_SIZE, TOTAL_FRAMES - batchStart);
    const indices = [];
    for (let i = 0; i < batchCount; i++) {
      indices.push(batchStart + i);
    }

    const base64List = await page.evaluate((batchIndices) => {
      const canvas = document.getElementById('motionCanvas');
      const list = [];
      for (const idx of batchIndices) {
        renderFrame(idx);
        const url = canvas.toDataURL('image/jpeg', 0.90);
        list.push(url.slice(23));
      }
      return list;
    }, indices);

    for (const b64 of base64List) {
      const buf = Buffer.from(b64, 'base64');
      const canWrite = ffmpeg.stdin.write(buf);
      if (!canWrite) {
        await new Promise(r => ffmpeg.stdin.once('drain', r));
      }
    }

    renderedFrames += batchCount;
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const pct = ((renderedFrames / TOTAL_FRAMES) * 100).toFixed(1);
    const fpsSpeed = (renderedFrames / (elapsedSec || 0.1)).toFixed(1);
    process.stdout.write(`\r⏳ 渲染進度: ${renderedFrames}/${TOTAL_FRAMES} 幀 [${pct}%] | 已耗時: ${elapsedSec}s | 速度: ${fpsSpeed} FPS`);
  }

  console.log('\n\n✅ 所有 2400 幀直式影片渲染完成，正在封裝 MP4 並移動 moov atom 到開頭...');
  await browser.close();
  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`\n🎉 80秒直式手機版 Antigravity 十大神級指令全攻略渲染大成功！`);
        console.log(`檔案位置: ${OUTPUT_MP4}`);
        const stats = fs.statSync(OUTPUT_MP4);
        console.log(`檔案大小: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

main().catch((err) => {
  console.error('\n❌ 渲染失敗:', err);
  process.exit(1);
});
