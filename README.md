# Coding Duel ⚔️
## Competitive Coding Esports Platform — Version 1.0

Coding Duel is a fast-paced, competitive coding knowledge and typing platform inspired by the intensity of mental math duels, tailored for programmers. Users compete in rapid battles against simulated AI bots with dynamic Elo scaling, ranking tiers, level progression, and multi-category leaderboards.

---

## 🎮 Game Modes

### 1. One-Word Duel (60 Seconds)
- Rapid-fire typing of short programming keywords, syntax tokens, and standard library functions.
- Instant feedback with case-insensitive validation and flexible keyword aliases.

### 2. MCQ Duel (60 Seconds)
- 4-option multiple choice questions covering language syntax, idioms, concepts, and standard methods.
- Visual feedback on selection with full keyboard (`Enter`) and mouse support.

### 3. Typing Duel (30 Seconds)
- Fast-paced 30-second typing battle using realistic programming snippets.
- Live WPM, real-time accuracy, character progress indicators, and visual error marking.

---

## 🏆 Rating & Ranking System v1.0

### Three Independent Elo Skill Ratings
- **One-Word Rating** (`oneWordRating`)
- **MCQ Rating** (`mcqRating`)
- **Typing Rating** (`typingRating`)
- Every player starts at **1000** with an absolute minimum floor of **100**. Matches in one mode never affect ratings in other modes.

### Elo Rating Algorithm
- **Formula**:
  $$E_A = \frac{1}{1 + 10^{\frac{R_B - R_A}{400}}}$$
  $$\Delta = \text{round}(K \times (S_A - E_A)), \quad K = 24$$
- **Bot Ratings**: Easy (800), Medium (1200), Hard (1600).
- **Dynamic Risk/Reward**: Defeating a Hard Bot yields significantly higher Elo (+23) than an Easy Bot (+6).

### 8 Competitive Tiers
- **Beginner**: < 800
- **Novice**: 800 – 999
- **Intermediate**: 1000 – 1199
- **Advanced**: 1200 – 1399
- **Expert**: 1400 – 1599
- **Master**: 1600 – 1799
- **Grandmaster**: 1800 – 1999
- **Legend**: 2000+

### XP & Level Progression System
- Engagement progression decoupled from skill ratings:
  - Match Completion: **+10 XP**
  - Victory Bonus: **+15 XP**
  - Draw Bonus: **+5 XP**
  - First Duel of the Day: **+5 XP**
- **Quadratic Level Progression Formula**:
  $$\text{Cumulative XP to reach Level } L = 25(L - 1)(L + 2)$$

---

## 📊 Competitive Features

- **Multi-Category Leaderboard**: 4 categories (Overall XP, One-Word, MCQ, Typing) with 3 time filters (All-Time, Monthly, Weekly) and top-3 podium display.
- **Interactive Profile**: Level progression bar, mode breakdown cards, and SVG rating progression charts.
- **Post-Duel Breakdown**: Real-time Elo $\pm \Delta$, tier promotion alerts, and XP reward breakdowns.
- **Bot Transparency**: Disclosed bot ratings for fair competitive context.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT authentication with bcrypt password hashing

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or via Docker)

### 1. Database Setup
```bash
cd backend
npx prisma db push
npx tsx prisma/seed.ts
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
# App runs on http://localhost:3000
```

### 4. Run Rating System Verification Suite
```bash
cd backend
node src/test_rating_system.js
```
