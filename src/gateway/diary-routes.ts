/**
 * Diary API Routes
 * 
 * Bot 日记和情绪数据 API
 * 
 * @module gateway/diary-routes
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { botDiary, type DailySummary } from "../agents/bot-diary.js";
import { emotionIndicator } from "../agents/emotion-indicator.js";

const log = createSubsystemLogger("diary-api");

/**
 * Diary API Response
 */
interface DiaryApiResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}

/**
 * Handle Diary API Requests
 */
export async function handleDiaryRoutes(
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string
): Promise<boolean> {
    // Only handle /api/diary/* routes
    if (!pathname.startsWith("/api/diary") && !pathname.startsWith("/api/emotion")) {
        return false;
    }

    res.setHeader("Content-Type", "application/json");

    try {
        // GET /api/diary/today - Today's summary
        if (pathname === "/api/diary/today" && req.method === "GET") {
            const summary = botDiary.generateSummary();
            sendSuccess(res, summary);
            return true;
        }

        // GET /api/diary/:date - Specific date summary
        const dateMatch = pathname.match(/^\/api\/diary\/(\d{4}-\d{2}-\d{2})$/);
        if (dateMatch && req.method === "GET") {
            const date = dateMatch[1];
            const summary = botDiary.generateSummary(date);
            sendSuccess(res, summary);
            return true;
        }

        // GET /api/diary/report/:date - Markdown report
        const reportMatch = pathname.match(/^\/api\/diary\/report\/(\d{4}-\d{2}-\d{2})$/);
        if (reportMatch && req.method === "GET") {
            const date = reportMatch[1];
            const report = botDiary.generateReport(date);
            res.setHeader("Content-Type", "text/markdown");
            res.end(report);
            return true;
        }

        // GET /api/emotion/current - Current emotion state
        if (pathname === "/api/emotion/current" && req.method === "GET") {
            const state = emotionIndicator.getState();
            const emoji = emotionIndicator.getEmoji();
            const display = emotionIndicator.getDisplay();
            sendSuccess(res, { ...state, emoji, display });
            return true;
        }

        // GET /api/diary/range?start=YYYY-MM-DD&end=YYYY-MM-DD - Date range
        if (pathname === "/api/diary/range" && req.method === "GET") {
            const url = new URL(req.url || "", `http://${req.headers.host}`);
            const start = url.searchParams.get("start");
            const end = url.searchParams.get("end");

            if (!start || !end) {
                sendError(res, 400, "Missing start or end date");
                return true;
            }

            // Generate summaries for date range
            const summaries: Record<string, DailySummary> = {};
            const startDate = new Date(start);
            const endDate = new Date(end);

            for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split("T")[0];
                summaries[dateStr] = botDiary.generateSummary(dateStr);
            }

            sendSuccess(res, summaries);
            return true;
        }

        // 404 for unmatched diary routes
        sendError(res, 404, "Diary endpoint not found");
        return true;

    } catch (err) {
        log.error(`Diary API error: ${String(err)}`);
        sendError(res, 500, "Internal server error");
        return true;
    }
}

function sendSuccess(res: ServerResponse, data: unknown): void {
    const response: DiaryApiResponse = { success: true, data };
    res.statusCode = 200;
    res.end(JSON.stringify(response));
}

function sendError(res: ServerResponse, status: number, message: string): void {
    const response: DiaryApiResponse = { success: false, error: message };
    res.statusCode = status;
    res.end(JSON.stringify(response));
}
