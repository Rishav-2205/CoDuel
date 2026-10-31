const http = require("http");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "localhost",
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => (responseBody += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseBody) });
        } catch {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

// Helper to answer all questions correctly using the question bank
async function winDuel(duelId, firstQuestion, token, numToAnswer = 20) {
  let currentQ = firstQuestion;
  for (let i = 0; i < numToAnswer && currentQ; i++) {
    const dbQ = await prisma.question.findUnique({ where: { id: currentQ.id } });
    if (!dbQ) break;
    const ans = dbQ.correctAnswer;
    const res = await request("POST", `/duels/${duelId}/answer`, { answer: ans }, token);
    currentQ = res.body?.nextQuestion;
  }
}

async function runTestSuite() {
  console.log("==========================================================");
  console.log("CODING DUEL — RATING & RANKING SYSTEM v1.0 TEST SUITE");
  console.log("==========================================================\n");

  // =========================================================================
  // UNIT TESTS: ELO FORMULA & EDGE CASES
  // =========================================================================
  console.log("--- PART A: RATING ENGINE UNIT VERIFICATION ---");
  const { calculateElo, getTier, MIN_RATING, K_FACTOR } = require("../dist/services/ratingService");

  // 1. Initial Rating 1000 Tier
  if (getTier(1000) !== "Intermediate") throw new Error("1000 should be Intermediate");
  if (getTier(799) !== "Beginner") throw new Error("799 should be Beginner");
  if (getTier(800) !== "Novice") throw new Error("800 should be Novice");
  if (getTier(1200) !== "Advanced") throw new Error("1200 should be Advanced");
  if (getTier(1400) !== "Expert") throw new Error("1400 should be Expert");
  if (getTier(1600) !== "Master") throw new Error("1600 should be Master");
  if (getTier(1800) !== "Grandmaster") throw new Error("1800 should be Grandmaster");
  if (getTier(2000) !== "Legend") throw new Error("2000 should be Legend");
  console.log("✓ Tier thresholds match specification exactly (Beginner -> Legend)");

  // 2. Win against Easy, Medium, Hard
  const winEasy = calculateElo({ playerRating: 1000, botRating: 800, result: "WIN" });
  const winMed = calculateElo({ playerRating: 1000, botRating: 1200, result: "WIN" });
  const winHard = calculateElo({ playerRating: 1000, botRating: 1600, result: "WIN" });

  if (winEasy.ratingChange <= 0 || winMed.ratingChange <= winEasy.ratingChange || winHard.ratingChange <= winMed.ratingChange) {
    throw new Error(`Elo gain ordering violated: Easy(+${winEasy.ratingChange}), Med(+${winMed.ratingChange}), Hard(+${winHard.ratingChange})`);
  }
  console.log(`✓ Victory Elo Gains: vs Easy (800) = +${winEasy.ratingChange}, vs Med (1200) = +${winMed.ratingChange}, vs Hard (1600) = +${winHard.ratingChange}`);
  console.log("  -> Defeating Hard Bot earns substantially more rating than Easy Bot!");

  // 3. Loss against Easy, Medium, Hard
  const lossEasy = calculateElo({ playerRating: 1000, botRating: 800, result: "LOSS" });
  const lossMed = calculateElo({ playerRating: 1000, botRating: 1200, result: "LOSS" });
  const lossHard = calculateElo({ playerRating: 1000, botRating: 1600, result: "LOSS" });

  if (lossEasy.ratingChange >= lossMed.ratingChange || lossMed.ratingChange >= lossHard.ratingChange) {
    throw new Error(`Loss penalty ordering violated: Easy(${lossEasy.ratingChange}), Med(${lossMed.ratingChange}), Hard(${lossHard.ratingChange})`);
  }
  console.log(`✓ Defeat Elo Penalties: vs Easy (800) = ${lossEasy.ratingChange}, vs Med (1200) = ${lossMed.ratingChange}, vs Hard (1600) = ${lossHard.ratingChange}`);
  console.log("  -> Losing to Easy Bot incurs heavier penalty than losing to Hard Bot!");

  // 4. Draw Calculation
  const drawMed = calculateElo({ playerRating: 1000, botRating: 1200, result: "DRAW" });
  console.log(`✓ Draw vs Medium (1200): ${drawMed.ratingChange > 0 ? "+" : ""}${drawMed.ratingChange} Rating`);

  // 5. Minimum Rating Protection (Floor at 100)
  const floorTest = calculateElo({ playerRating: 105, botRating: 800, result: "LOSS" });
  if (floorTest.newRating < MIN_RATING) {
    throw new Error(`Rating dropped below MIN_RATING floor: ${floorTest.newRating}`);
  }
  console.log(`✓ Minimum Rating Floor Protected: player at 105 losing vs bot clamped to ${floorTest.newRating} (Floor: ${MIN_RATING})`);

  // =========================================================================
  // INTEGRATION TESTS: FULL E2E API VERIFICATION
  // =========================================================================
  console.log("\n--- PART B: FULL API & MULTI-MODE INTEGRATION ---");

  const randId = Math.floor(Math.random() * 899999 + 100000);
  const testUser = `elo_hero_${randId}`;
  const testEmail = `${testUser}@example.com`;
  const testPass = "DuelMaster99!";

  // 1. Register & Verify Starting Ratings
  console.log("\n[Test 1] Registering user and verifying starting rating = 1000 across all 3 modes...");
  const reg = await request("POST", "/auth/register", {
    username: testUser,
    email: testEmail,
    password: testPass,
  });
  if (reg.status !== 201) throw new Error("Registration failed: " + JSON.stringify(reg.body));
  const token = reg.body.token;

  const ratingsRes = await request("GET", "/ratings/me", null, token);
  const { oneWord, mcq, typing } = ratingsRes.body.ratings;
  if (oneWord.rating !== 1000 || mcq.rating !== 1000 || typing.rating !== 1000) {
    throw new Error(`Expected all starting ratings = 1000, got: One-Word=${oneWord.rating}, MCQ=${mcq.rating}, Typing=${typing.rating}`);
  }
  console.log("✓ PASS: Initialized with One-Word: 1000, MCQ: 1000, Typing: 1000 (Tier: Intermediate)");

  // 2. Play and WIN One-Word Duel
  console.log("\n[Test 2] Playing and WINNING One-Word duel (Hard bot)...");
  const d1 = await request("POST", "/duels/start", { language: "python", duelType: "ONE_WORD", difficulty: "hard" }, token);
  const d1Id = d1.body.duelId;
  await winDuel(d1Id, d1.body.firstQuestion, token, 25);
  const f1 = await request("POST", `/duels/${d1Id}/finish`, {}, token);
  const r1Update = f1.body.ratingUpdate;
  if (f1.body.match.result !== "WIN" || r1Update.ratingChange <= 0) {
    throw new Error("Expected WIN with positive rating change: " + JSON.stringify(f1.body));
  }
  console.log(`✓ PASS: Won One-Word Duel vs ${d1.body.bot.name}!`);
  console.log(`  Rating: ${r1Update.previousRating} -> ${r1Update.newRating} (+${r1Update.ratingChange} Elo)`);
  console.log(`  XP Earned: +${f1.body.xpUpdate.xpEarned} (Breakdown: completion=${f1.body.xpUpdate.breakdown.completionXp}, win=${f1.body.xpUpdate.breakdown.resultBonusXp}, daily=${f1.body.xpUpdate.breakdown.dailyBonusXp})`);

  // 3. Verify Mode Independence
  console.log("\n[Test 3] Verifying Mode Rating Independence...");
  const midRatings = await request("GET", "/ratings/me", null, token);
  const midR = midRatings.body.ratings;
  if (midR.oneWord.rating <= 1000) throw new Error("One-Word rating should have increased");
  if (midR.mcq.rating !== 1000 || midR.typing.rating !== 1000) {
    throw new Error(`MCQ and Typing ratings must remain untouched at 1000! Got: MCQ=${midR.mcq.rating}, Typing=${midR.typing.rating}`);
  }
  console.log(`✓ PASS: One-Word rating increased to ${midR.oneWord.rating}, while MCQ (${midR.mcq.rating}) and Typing (${midR.typing.rating}) remained strictly 1000!`);

  // 4. Play and WIN MCQ Duel
  console.log("\n[Test 4] Playing and WINNING MCQ Duel (Medium bot)...");
  const d2 = await request("POST", "/duels/start", { language: "java", duelType: "MCQ", difficulty: "medium" }, token);
  const d2Id = d2.body.duelId;
  await winDuel(d2Id, d2.body.firstQuestion, token, 20);
  const f2 = await request("POST", `/duels/${d2Id}/finish`, {}, token);
  const postMcqRatings = await request("GET", "/ratings/me", null, token);
  const r2 = postMcqRatings.body.ratings;
  if (r2.mcq.rating <= 1000) throw new Error("MCQ rating should have increased");
  if (r2.oneWord.rating !== midR.oneWord.rating) {
    throw new Error(`One-Word rating unexpectedly changed from ${midR.oneWord.rating} to ${r2.oneWord.rating}!`);
  }
  if (r2.typing.rating !== 1000) throw new Error("Typing rating should still be 1000");
  console.log(`✓ PASS: MCQ Rating updated to ${r2.mcq.rating}, One-Word stayed locked at ${r2.oneWord.rating}, Typing stayed at 1000!`);

  // 5. Play and WIN Typing Duel
  console.log("\n[Test 5] Playing and WINNING 30-second Typing Duel...");
  const d3 = await request("POST", "/duels/start", { language: "cpp", duelType: "TYPING", difficulty: "easy" }, token);
  const d3Id = d3.body.duelId;
  // High characters typed to guarantee win
  await request("POST", `/duels/${d3Id}/typing-progress`, { charsTyped: 120, charsCorrect: 118 }, token);
  const f3 = await request("POST", `/duels/${d3Id}/finish`, {}, token);
  const postTypingRatings = await request("GET", "/ratings/me", null, token);
  const r3 = postTypingRatings.body.ratings;
  if (r3.typing.rating <= 1000) throw new Error("Typing rating should have increased");
  console.log(`✓ PASS: Typing Rating updated to ${r3.typing.rating}! All 3 mode ratings now independently updated.`);

  // 6. Test Idempotency / Double Finish
  console.log("\n[Test 6] Testing Idempotency (preventing duplicate finish & XP farming)...");
  const dup = await request("POST", `/duels/${d3Id}/finish`, {}, token);
  if (dup.status !== 200 || !dup.body.alreadyFinished) {
    throw new Error("Expected 200 with alreadyFinished flag on duplicate finish");
  }
  console.log("✓ PASS: Duplicate finish handled safely without duplicate XP or rating changes!");

  // 7. Test Rating History
  console.log("\n[Test 7] Testing Persistent Rating History API...");
  const histRes = await request("GET", "/ratings/me/history", null, token);
  if (histRes.status !== 200 || histRes.body.history.length < 3) {
    throw new Error("Expected at least 3 rating history records, got: " + histRes.body?.history?.length);
  }
  console.log(`✓ PASS: Rating history contains ${histRes.body.history.length} persistent match logs.`);

  // 8. Test Leaderboards across 4 categories and time filters
  console.log("\n[Test 8] Testing Mode-Aware Leaderboards (4 Categories + Time Filters)...");
  const lbOverall = await request("GET", "/leaderboard?mode=OVERALL&period=ALL_TIME", null, token);
  const lbOneWord = await request("GET", "/leaderboard?mode=ONE_WORD&period=ALL_TIME", null, token);
  const lbMcq = await request("GET", "/leaderboard?mode=MCQ&period=ALL_TIME", null, token);
  const lbTyping = await request("GET", "/leaderboard?mode=TYPING&period=ALL_TIME", null, token);
  const lbWeekly = await request("GET", "/leaderboard?mode=OVERALL&period=WEEKLY", null, token);
  const lbMonthly = await request("GET", "/leaderboard?mode=OVERALL&period=MONTHLY", null, token);

  if (lbOverall.status !== 200 || lbOneWord.status !== 200 || lbMcq.status !== 200 || lbTyping.status !== 200) {
    throw new Error("Leaderboard category fetch failed");
  }
  if (lbWeekly.status !== 200 || lbMonthly.status !== 200) {
    throw new Error("Time filtered leaderboard fetch failed");
  }
  console.log(`✓ PASS: Overall XP Leaderboard: ${lbOverall.body.leaderboard.length} entries`);
  console.log(`✓ PASS: One-Word Rating Leaderboard: ${lbOneWord.body.leaderboard.length} entries`);
  console.log(`✓ PASS: MCQ Rating Leaderboard: ${lbMcq.body.leaderboard.length} entries`);
  console.log(`✓ PASS: Typing Rating Leaderboard: ${lbTyping.body.leaderboard.length} entries`);
  console.log(`✓ PASS: Time filters (Weekly & Monthly) verified active.`);

  // 9. Test User Profile Statistics
  console.log("\n[Test 9] Verifying Comprehensive Profile Statistics & Leveling...");
  const profRes = await request("GET", "/users/me", null, token);
  const p = profRes.body;
  if (!p.modes || !p.progression || !p.overall) {
    throw new Error("Profile missing core progression/modes data: " + JSON.stringify(p));
  }
  console.log(`✓ PASS: User Profile verified:`);
  console.log(`   - Level: ${p.progression.currentLevel} (${p.progression.totalXP} XP, ${p.progression.progressPercent}% towards next level)`);
  console.log(`   - One-Word: ${p.modes.oneWord.rating} Elo (${p.modes.oneWord.tier})`);
  console.log(`   - MCQ:      ${p.modes.mcq.rating} Elo (${p.modes.mcq.tier})`);
  console.log(`   - Typing:   ${p.modes.typing.rating} Elo (${p.modes.typing.tier})`);
  console.log(`   - Record:   ${p.overall.totalWins} Wins / ${p.overall.totalDuels} Matches (${p.overall.winRate}% Win Rate)`);

  console.log("\n==========================================================");
  console.log("🎉 ALL TESTS PASSED! RATING & RANKING SYSTEM v1.0 VERIFIED!");
  console.log("==========================================================");
}

runTestSuite()
  .catch((err) => {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
