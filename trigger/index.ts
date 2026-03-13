import { task } from '@trigger.dev/sdk/v3';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

const ffmpeg = require('fluent-ffmpeg');
import ffmpegPath from 'ffmpeg-static';
import { tmpdir } from 'os';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Configure FFmpeg - try ffmpeg-static first, fallback to system ffmpeg
const resolveFFmpegPath = () => {
  if (ffmpegPath && existsSync(ffmpegPath)) {
    return ffmpegPath;
  }
  // In Trigger.dev environments, ffmpeg might be installed globally or via system dependencies
  // Return undefined to let ffmpeg use system PATH
  console.log('Using system FFmpeg from PATH');
  return undefined;
};

const ffmpegBinaryPath = resolveFFmpegPath();
if (ffmpegBinaryPath) {
  ffmpeg.setFfmpegPath(ffmpegBinaryPath);
}

const GEMINI_MODEL = 'gemini-1.5-flash-latest';

/**
 * Execute LLM task with Google Generative AI
 */
export const executeLLMTask = task({
  id: 'execute-llm',
  run: async (payload: {
    nodeId: string;
    model?: string;
    systemPrompt?: string;
    userMessage: string;
    images?: string[];
  }) => {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = payload.model || GEMINI_MODEL;
    const model = genAI.getGenerativeModel({ model: modelName });

    let prompt = payload.userMessage;
    if (payload.systemPrompt) {
      prompt = `${payload.systemPrompt}\n\n${payload.userMessage}`;
    }

    const parts: any[] = [{ text: prompt }];

    // Add images if provided
    if (payload.images && payload.images.length > 0) {
      for (const imageUrl of payload.images) {
        try {
          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            console.warn(`Failed to fetch image: ${imageUrl}`);
            continue;
          }
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64Image = Buffer.from(imageBuffer).toString('base64');
          const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

          parts.push({
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          });
        } catch (error) {
          console.warn(`Error processing image ${imageUrl}:`, error);
        }
      }
    }

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const response = await result.response;
    const text = response.text();

    return { output: text };
  },
});

/**
 * Crop Image Task - processes image and uploads result
 */
export const executeCropImageTask = task({
  id: 'execute-crop-image',
  run: async (payload: {
    nodeId: string;
    image_url: string;
    x_percent: number;
    y_percent: number;
    width_percent: number;
    height_percent: number;
  }) => {
    if (!payload.image_url) {
      throw new Error('Image URL is required');
    }

    // Download image
    const response = await fetch(payload.image_url, {
    headers: {
      "User-Agent": "Trigger.dev Worker",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
    const meta = await sharp(buffer).metadata();

    const w = meta.width || 100;
    const h = meta.height || 100;

    let x = Math.round((payload.x_percent / 100) * w);
    let y = Math.round((payload.y_percent / 100) * h);
    let cropW = Math.round((payload.width_percent / 100) * w);
    let cropH = Math.round((payload.height_percent / 100) * h);

    x = Math.max(0, Math.min(x, w - 1));
    y = Math.max(0, Math.min(y, h - 1));
    cropW = Math.max(1, Math.min(cropW, w - x));
    cropH = Math.max(1, Math.min(cropH, h - y));

    const cropped = await sharp(buffer)
      .extract({ left: x, top: y, width: cropW, height: cropH })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Return as data URL (caller can upload to Transloadit if needed)
    const dataUrl = `data:image/jpeg;base64,${cropped.toString('base64')}`;
    return { output: dataUrl };
  },
});

/**
 * Extract Frame Task - extracts frame from video using FFmpeg
 */
export const executeExtractFrameTask = task({
  id: 'execute-extract-frame',
  run: async (payload: {
    nodeId: string;
    video_url: string;
    timestamp: number | string;
  }) => {
    if (!payload.video_url) {
      throw new Error('Video URL is required');
    }

    // Verify FFmpeg is available
    if (!ffmpegBinaryPath) {
      console.log('FFmpeg binary path not set, will use system PATH');
    }

    // Download video to temp file
    const videoResponse = await fetch(payload.video_url, {
      headers: {
        "User-Agent": "Trigger.dev Worker",
      },
    });
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video from ${payload.video_url}`);
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const tempVideoPath = path.join(tmpdir(), `video-${Date.now()}.mp4`);
    const tempFramePath = path.join(tmpdir(), `frame-${Date.now()}.jpg`);

    await writeFile(tempVideoPath, videoBuffer);

    try {
      // Parse timestamp
      const tsString = String(payload.timestamp).trim();
      let seconds = 0;

      if (tsString.endsWith('%')) {
        const percent = parseFloat(tsString.replace('%', ''));

        const duration = await new Promise<number>((resolve, reject) => {
          ffmpeg.ffprobe(tempVideoPath, (err: Error, metadata: any) => {
            if (err) return reject(err);
            resolve(metadata.format.duration || 0);
          });
        });

        seconds = (percent / 100) * duration;
      } else {
        seconds = Number(tsString) || 0;
      }

      seconds = Math.max(0, seconds);

      if (isNaN(seconds)) {
        throw new Error("Invalid timestamp");
      }
      // Extract frame using FFmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempVideoPath)
          .seekInput(seconds)
          .frames(1)
          .outputOptions("-q:v 2")
          .save(tempFramePath)
          .on("start", (cmd: string) => {
            console.log("FFmpeg command:", cmd);
          })
          .on("stderr", (line: string) => {
            console.log("FFmpeg:", line);
          })
          .on("end", () => {
            console.log("Frame extracted successfully");
            resolve();
          })
          .on("error", (err: Error) => {
            console.error("FFmpeg error:", err);
            reject(err);
          });
      });

const fs = await import("fs/promises");

try {
  await fs.access(tempFramePath);
} catch {
  throw new Error("FFmpeg did not produce frame file");
}

const frameBuffer = await fs.readFile(tempFramePath);

const dataUrl = `data:image/jpeg;base64,${frameBuffer.toString("base64")}`;

      // Cleanup temp files
      await unlink(tempVideoPath).catch(() => {});
      await unlink(tempFramePath).catch(() => {});

      return { output: dataUrl };
    } catch (error) {
      // Cleanup on error
      await unlink(tempVideoPath).catch(() => {});
      await unlink(tempFramePath).catch(() => {});
      throw error;
    }
  },
});

