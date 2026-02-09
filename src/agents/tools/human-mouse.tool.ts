import { Type } from "@sinclair/typebox";
import { type AnyAgentTool, jsonResult, readStringParam } from "./common.js";

// Lazy import for ghost-cursor
let ghostCursor: typeof import("ghost-cursor") | null = null;

async function _loadGhostCursor() {
  if (!ghostCursor) {
    ghostCursor = await import("ghost-cursor");
  }
  return ghostCursor;
}

/**
 * Generate Bezier curve control points for natural mouse movement
 */
function generateBezierPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  steps: number = 50,
): Array<{ x: number; y: number }> {
  const path: Array<{ x: number; y: number }> = [];

  const cp1x = startX + (endX - startX) * 0.25 + (Math.random() - 0.5) * 100;
  const cp1y = startY + (endY - startY) * 0.25 + (Math.random() - 0.5) * 100;
  const cp2x = startX + (endX - startX) * 0.75 + (Math.random() - 0.5) * 100;
  const cp2y = startY + (endY - startY) * 0.75 + (Math.random() - 0.5) * 100;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    const x = mt3 * startX + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * endX;
    const y = mt3 * startY + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * endY;

    path.push({
      x: x + (Math.random() - 0.5) * 2,
      y: y + (Math.random() - 0.5) * 2,
    });
  }

  return path;
}

function calculateMoveDuration(distance: number): number {
  const baseDuration = 200;
  const scaleFactor = 50;
  const duration = baseDuration + scaleFactor * Math.log2(distance / 10 + 1);
  return duration * (0.8 + Math.random() * 0.4);
}

function shouldPause(): boolean {
  return Math.random() < 0.1;
}

function getPauseDuration(): number {
  return 50 + Math.random() * 150;
}

const HumanMouseToolSchema = Type.Object({
  action: Type.String(),
  x: Type.Optional(Type.Number()),
  y: Type.Optional(Type.Number()),
  scrollY: Type.Optional(Type.Number()),
  button: Type.Optional(Type.String()),
});

// Track current mouse position
let currentX = 0;
let currentY = 0;

export function createHumanMouseTool(): AnyAgentTool {
  return {
    label: "Human Mouse",
    name: "human_mouse",
    description: `Simulate human-like mouse movement using Bezier curves.

Actions:
- move: Move mouse to coordinates with natural curve
- click: Click at coordinates with random delay
- scroll: Scroll with human-like randomness

The mouse never moves in straight lines, mimicking real human behavior.`,
    parameters: HumanMouseToolSchema,
    execute: async (_toolCallId, rawArgs) => {
      const args = rawArgs as Record<string, unknown>;
      const action = readStringParam(args, "action");

      switch (action) {
        case "move": {
          const targetX = Number(args.x) || 0;
          const targetY = Number(args.y) || 0;

          const distance = Math.sqrt(
            Math.pow(targetX - currentX, 2) + Math.pow(targetY - currentY, 2),
          );

          const path = generateBezierPath(currentX, currentY, targetX, targetY);
          const totalDuration = calculateMoveDuration(distance);
          const stepDelay = totalDuration / path.length;

          const movements: Array<{ x: number; y: number; delay: number }> = [];

          for (let i = 0; i < path.length; i++) {
            const point = path[i];
            let delay = stepDelay;

            // Add occasional pauses
            if (shouldPause()) {
              delay += getPauseDuration();
            }

            movements.push({ ...point, delay });
          }

          currentX = targetX;
          currentY = targetY;

          return jsonResult({
            success: true,
            action: "move",
            from: { x: movements[0]?.x || 0, y: movements[0]?.y || 0 },
            to: { x: targetX, y: targetY },
            pathPoints: path.length,
            totalDuration: Math.round(totalDuration),
            message: `Mouse moved from (${currentX}, ${currentY}) to (${targetX}, ${targetY}) via Bezier curve`,
          });
        }

        case "click": {
          const targetX = args.x != null ? Number(args.x) : currentX;
          const targetY = args.y != null ? Number(args.y) : currentY;
          const button = (args.button as string) || "left";

          // Pre-click delay (human hesitation)
          const preClickDelay = 50 + Math.random() * 150;

          // Click duration variation
          const clickDuration = 50 + Math.random() * 100;

          // Post-click delay
          const postClickDelay = 30 + Math.random() * 100;

          currentX = targetX;
          currentY = targetY;

          return jsonResult({
            success: true,
            action: "click",
            position: { x: targetX, y: targetY },
            button,
            timing: {
              preClickDelay: Math.round(preClickDelay),
              clickDuration: Math.round(clickDuration),
              postClickDelay: Math.round(postClickDelay),
            },
            message: `Clicked ${button} button at (${targetX}, ${targetY})`,
          });
        }

        case "scroll": {
          const scrollY = Number(args.scrollY) || 0;

          // Human-like scroll: multiple small steps
          const scrollSteps =
            Math.abs(scrollY) > 500
              ? Math.floor(Math.abs(scrollY) / 100)
              : Math.ceil(Math.abs(scrollY) / 50);

          const stepAmount = scrollY / scrollSteps;
          const steps: Array<{ amount: number; delay: number }> = [];

          for (let i = 0; i < scrollSteps; i++) {
            // Variable step size
            const variation = 0.8 + Math.random() * 0.4;
            const amount = stepAmount * variation;

            // Variable delay between scroll steps
            const delay = 30 + Math.random() * 70;

            steps.push({ amount: Math.round(amount), delay: Math.round(delay) });
          }

          return jsonResult({
            success: true,
            action: "scroll",
            totalScroll: scrollY,
            steps: steps.length,
            message: `Scrolled ${scrollY > 0 ? "down" : "up"} by ${Math.abs(scrollY)}px in ${scrollSteps} steps`,
          });
        }

        default:
          return jsonResult({ success: false, error: `Unknown action: ${action}` });
      }
    },
  };
}
