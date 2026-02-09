import { Router } from "express";
import { matchIdParamSchema } from "../validation/matches.js";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary.js";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.get("/", async (req, res) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      error: "invalid params",
      details: paramsParsed.error.issues,
    });
  }

  const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return res.status(400).json({
      error: "invalid query",
      details: queryParsed.error.issues,
    });
  }

  try {
    const matchId = paramsParsed.data.id;
    const limit = Math.min(queryParsed.data.limit ?? 100, MAX_LIMIT);

    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.status(200).json({ data });
  } catch (e) {
    console.error("Commentary retrieval error:", e);
    const errorDetails = {
      message: e?.message || "Unknown error",
      code: e?.code,
      stack: process.env.NODE_ENV === "development" ? e?.stack : undefined,
    };
    res.status(500).json({
      error: "Failed to retrieve commentary",
      details: errorDetails,
    });
  }
});

commentaryRouter.post("/", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      error: "missing request body",
      details: "ensure Content-Type: application/json header is set",
    });
  }

  const paramsParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      error: "invalid params",
      details: paramsParsed.error.issues,
    });
  }

  const bodyParsed = createCommentarySchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({
      error: "invalid payload",
      details: bodyParsed.error.issues,
    });
  }

  try {
    const data = bodyParsed.data;
    const values = {
      matchId: paramsParsed.data.id,
      minute: data.minute ?? 0,
      sequence: data.sequence ?? 0,
      period: data.period ?? "",
      eventType: data.eventType ?? "",
      actor: data.actor ?? "",
      team: data.team ?? "",
      message: data.message,
      metadata: data.metadata ?? null,
      tags: data.tags ?? null,
    };

    const [created] = await db.insert(commentary).values(values).returning();
    if (res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(created.matchId, created);
    }
    res.status(201).json({ data: created });
  } catch (e) {
    console.error("Commentary creation error:", e);
    const errorDetails = {
      message: e?.message || "Unknown error",
      code: e?.code,
      stack: process.env.NODE_ENV === "development" ? e?.stack : undefined,
    };
    res.status(500).json({
      error: "Failed to create commentary",
      details: errorDetails,
    });
  }
});
