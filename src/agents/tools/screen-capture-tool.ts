/**
 * Screen Capture Tool
 *
 * Capture screenshots and record screen.
 */

import { spawn, exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

const execAsync = promisify(exec);

export interface ScreenCaptureToolParams {
  config?: AeonSageConfig;
  outputDir?: string;
}

export interface ScreenCaptureResult {
  success: boolean;
  operation: string;
  path?: string;
  size?: number;
  duration?: number;
  error?: string;
}

/**
 * Get screenshot using platform-specific tool
 */
async function captureScreenshot(
  outputPath: string,
  options: { fullScreen?: boolean; window?: string; delay?: number },
): Promise<ScreenCaptureResult> {
  const platform = process.platform;

  try {
    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    if (options.delay && options.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.delay! * 1000));
    }

    if (platform === "darwin") {
      // macOS: use screencapture
      const args = ["-x"]; // Silent
      if (!options.fullScreen && options.window) {
        args.push("-l", options.window);
      }
      args.push(outputPath);

      await execAsync(`screencapture ${args.join(" ")}`);
    } else if (platform === "win32") {
      // Windows: use PowerShell
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        $screen = [System.Windows.Forms.Screen]::PrimaryScreen
        $bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)
        $path = "${outputPath}"
        $path = $path -replace "\\\\", "\\\\"
        $bitmap.Save($path)
        $graphics.Dispose()
        $bitmap.Dispose()
      `;
      await execAsync(`powershell -Command "${script.replace(/\n/g, " ")}"`);
    } else {
      // Linux: try different tools
      try {
        await execAsync(`scrot -o "${outputPath}"`);
      } catch {
        try {
          await execAsync(`import -window root "${outputPath}"`);
        } catch {
          await execAsync(`gnome-screenshot -f "${outputPath}"`);
        }
      }
    }

    // Verify file exists
    const stats = await fs.stat(outputPath);

    return {
      success: true,
      operation: "screenshot",
      path: outputPath,
      size: stats.size,
    };
  } catch (error) {
    return {
      success: false,
      operation: "screenshot",
      error: error instanceof Error ? error.message : "Screenshot failed",
    };
  }
}

/**
 * Record screen using FFmpeg
 */
async function recordScreen(
  outputPath: string,
  duration: number,
  options: { fps?: number; quality?: string },
): Promise<ScreenCaptureResult> {
  const platform = process.platform;
  const fps = options.fps ?? 30;

  return new Promise((resolve) => {
    void (async () => {
      try {
        // Ensure output directory exists
        await fs.mkdir(path.dirname(outputPath), { recursive: true });

        let args: string[];

        if (platform === "darwin") {
          // macOS
          args = [
            "-f",
            "avfoundation",
            "-i",
            "1:none", // Screen input
            "-t",
            String(duration),
            "-r",
            String(fps),
            "-y",
            outputPath,
          ];
        } else if (platform === "win32") {
          // Windows
          args = [
            "-f",
            "gdigrab",
            "-i",
            "desktop",
            "-t",
            String(duration),
            "-r",
            String(fps),
            "-y",
            outputPath,
          ];
        } else {
          // Linux
          const display = process.env.DISPLAY ?? ":0";
          args = [
            "-f",
            "x11grab",
            "-i",
            display,
            "-t",
            String(duration),
            "-r",
            String(fps),
            "-y",
            outputPath,
          ];
        }

        const child = spawn("ffmpeg", args, {
          timeout: (duration + 10) * 1000,
        });

        let stderr = "";
        child.stderr?.on("data", (data) => {
          stderr += data.toString();
        });

        child.on("close", async (code) => {
          if (code === 0) {
            try {
              const stats = await fs.stat(outputPath);
              resolve({
                success: true,
                operation: "record",
                path: outputPath,
                size: stats.size,
                duration,
              });
            } catch {
              resolve({
                success: false,
                operation: "record",
                error: "Recording file not created",
              });
            }
          } else {
            resolve({
              success: false,
              operation: "record",
              error: stderr || `FFmpeg exited with code ${code}`,
            });
          }
        });

        child.on("error", (err) => {
          resolve({
            success: false,
            operation: "record",
            error: `FFmpeg not available: ${err.message}`,
          });
        });
      } catch (error) {
        resolve({
          success: false,
          operation: "record",
          error: error instanceof Error ? error.message : "Recording failed",
        });
      }
    })();
  });
}

/**
 * Create the screen capture tool
 */
export function createScreenCaptureTool(params: ScreenCaptureToolParams = {}) {
  const defaultOutputDir = params.outputDir ?? path.join(os.tmpdir(), "aeonsage", "captures");

  return {
    name: "screen_capture",
    description: `Capture screenshots and record screen.

Operations:
- screenshot: Take a screenshot
- record: Record screen video (requires FFmpeg)

Features:
- Full screen or window capture
- Delayed capture
- Video recording with configurable FPS
- Cross-platform support (macOS, Windows, Linux)

Output formats:
- Screenshots: PNG
- Recordings: MP4

Requirements:
- macOS: Built-in screencapture
- Windows: PowerShell (screenshots), FFmpeg (recording)
- Linux: scrot/import/gnome-screenshot, FFmpeg (recording)`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["screenshot", "record"],
          description: "Capture action. Default is 'screenshot'.",
        },
        filename: {
          type: "string",
          description: "Output filename (without path). Auto-generated if not provided.",
        },
        outputDir: {
          type: "string",
          description: "Output directory. Uses temp dir if not specified.",
        },
        duration: {
          type: "number",
          description: "Recording duration in seconds (for 'record' action). Default is 10.",
        },
        delay: {
          type: "number",
          description: "Delay in seconds before capture. Default is 0.",
        },
        fullScreen: {
          type: "boolean",
          description: "Capture full screen. Default is true.",
        },
        fps: {
          type: "number",
          description: "Frames per second for recording. Default is 30.",
        },
      },
      required: [],
    },
    call: async (input: {
      action?: "screenshot" | "record";
      filename?: string;
      outputDir?: string;
      duration?: number;
      delay?: number;
      fullScreen?: boolean;
      fps?: number;
    }): Promise<ScreenCaptureResult> => {
      const action = input.action ?? "screenshot";
      const outputDir = input.outputDir ?? defaultOutputDir;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      try {
        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });

        if (action === "screenshot") {
          const filename = input.filename ?? `screenshot-${timestamp}.png`;
          const outputPath = path.join(outputDir, filename);

          return captureScreenshot(outputPath, {
            fullScreen: input.fullScreen ?? true,
            delay: input.delay,
          });
        } else if (action === "record") {
          const filename = input.filename ?? `recording-${timestamp}.mp4`;
          const outputPath = path.join(outputDir, filename);
          const duration = input.duration ?? 10;

          if (input.delay && input.delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, input.delay! * 1000));
          }

          return recordScreen(outputPath, duration, {
            fps: input.fps,
          });
        } else {
          return {
            success: false,
            operation: action,
            error: `Unknown action: ${String(action)}`,
          };
        }
      } catch (error) {
        return {
          success: false,
          operation: action,
          error: error instanceof Error ? error.message : "Capture failed",
        };
      }
    },
  };
}
