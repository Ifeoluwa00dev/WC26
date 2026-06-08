<div align="center">

# 🏆 WC26 Fan Intelligence Platform
### FIFA World Cup 2026 — Live Tournament Tracker & Analytics Dashboard

*Every Squad. Every Group. Every Story.*

</div>

---

## Overview

WC26 Fan Intelligence is a production-grade football analytics platform 
built for the 2026 FIFA World Cup. Track all 12 group standings, simulate 
knockout brackets, explore live player analytics, and search across every 
squad, coach, and nation in the tournament.

---

## Features

- **Live Tournament Tracker** — Real-time group standings across all 12 groups 
  with color-coded advancement indicators
- **Knockout Bracket Tree** — Interactive bracket from Round of 32 to the Final 
  with score editing and path simulation
- **Group Stage Simulator** — Monte Carlo-powered batch simulation for all 
  unplayed matches
- **Global Intelligence Dashboard** — Live charts covering confederation 
  breakdowns, squad ages, club representation, and win probabilities
- **Unified Search** — Fuzzy search across players, coaches, nations, 
  and draw pools powered by Fuse.js

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS + Glassmorphism |
| Charts | Recharts |
| Search | Fuse.js (client-side) |
| Data | football-data.org API (free tier) |
| Fonts | Bebas Neue + Inter |

---

## Run Locally

**Prerequisites:** Node.js v18+

1. Clone the repository:
```bash
   git clone https://github.com/yourusername/wc26-fan-intelligence.git
   cd wc26-fan-intelligence
```

2. Install dependencies:
```bash
   npm install
```

3. Set up your environment variables.
   Copy the example file:
```bash
   cp .env.example .env
```
   