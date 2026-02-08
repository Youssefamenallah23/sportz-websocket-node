import { Router } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm";

export const matchRouter = Router();

matchRouter.get("/", async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);
  const max_limit = 100;
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid query",
      details: parsed.error.issues,
    });
  }
  const limit = Math.min(parsed.data.limit ?? 50, max_limit);
  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);
    res.json({ data });
  } catch (e) {
    res.status(500).json({
      error: "Failed to retrieve matches",
      details: JSON.stringify(e),
    });
  }
});

matchRouter.post("/", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid payload",
      details: parsed.error.issues,
    });
  }
  try {
    const { startTime, endTime, homeScore, awayScore } = parsed.data;
    const [event] = await db
      .insert(matches)
      .values({
        sport: parsed.data.sport,
        homeTeam: parsed.data.homeTeam,
        awayTeam: parsed.data.awayTeam,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore !== undefined ? homeScore : 0,
        awayScore: awayScore !== undefined ? awayScore : 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();
    res.status(201).json({ data: event });
  } catch (e) {
    res
      .status(500)
      .json({ error: "Failed to create match", details: JSON.stringify(e) });
  }
});
