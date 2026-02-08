import { eq } from "drizzle-orm";
import { db, pool } from "./db/db.js";
import { matches, commentary } from "./db/schema.js";

async function main() {
  try {
    console.log("Performing CRUD operations on sports data...\n");

    // CREATE: Insert a new match
    const [newMatch] = await db
      .insert(matches)
      .values({
        sport: "Football",
        homeTeam: "Manchester United",
        awayTeam: "Liverpool",
        status: "scheduled",
        startTime: new Date("2026-02-15T20:00:00Z"),
      })
      .returning();

    if (!newMatch) {
      throw new Error("Failed to create match");
    }

    console.log("✅ CREATE MATCH: New match created:", newMatch);

    // CREATE: Insert match commentary
    const [newCommentary] = await db
      .insert(commentary)
      .values({
        matchId: newMatch.id,
        minute: 15,
        sequence: 1,
        period: "First Half",
        eventType: "goal",
        actor: "Bruno Fernandes",
        team: "Manchester United",
        message: "GOOOAAL! Bruno Fernandes scores a brilliant free kick!",
        metadata: { velocity: "95 km/h", distance: "25m" },
        tags: ["goal", "free-kick", "exciting"],
      })
      .returning();

    if (!newCommentary) {
      throw new Error("Failed to create commentary");
    }

    console.log("✅ CREATE COMMENTARY: New commentary added:", newCommentary);

    // READ: Select the match
    const foundMatch = await db
      .select()
      .from(matches)
      .where(eq(matches.id, newMatch.id));
    console.log("✅ READ MATCH: Found match:", foundMatch[0]);

    // READ: Select the commentary
    const foundCommentary = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, newMatch.id));
    console.log("✅ READ COMMENTARY: Found commentary:", foundCommentary[0]);

    // UPDATE: Change match status to live
    const [updatedMatch] = await db
      .update(matches)
      .set({ status: "live" })
      .where(eq(matches.id, newMatch.id))
      .returning();

    if (!updatedMatch) {
      throw new Error("Failed to update match");
    }

    console.log("✅ UPDATE MATCH: Match status updated to live:", updatedMatch);

    // UPDATE: Update match scores
    const [scoredMatch] = await db
      .update(matches)
      .set({ homeScore: 2, awayScore: 1 })
      .where(eq(matches.id, newMatch.id))
      .returning();

    if (!scoredMatch) {
      throw new Error("Failed to update scores");
    }

    console.log("✅ UPDATE SCORES: Match scores updated:", scoredMatch);

    // DELETE: Remove commentary
    await db.delete(commentary).where(eq(commentary.id, newCommentary.id));
    console.log("✅ DELETE COMMENTARY: Commentary entry deleted.");

    // DELETE: Remove match
    await db.delete(matches).where(eq(matches.id, newMatch.id));
    console.log("✅ DELETE MATCH: Match deleted.");

    console.log("\nCRUD operations completed successfully.");
  } catch (error) {
    console.error("❌ Error performing CRUD operations:", error);
    process.exit(1);
  } finally {
    // Close the connection pool
    if (pool) {
      await pool.end();
      console.log("Database pool closed.");
    }
  }
}

main();
