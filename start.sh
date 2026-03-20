#!/usr/bin/env bash
# ============================================================
#  KavachForWork — One-command local setup & launch
#  Usage: chmod +x start.sh && ./start.sh
# ============================================================

set -e

GREEN='\033[0;32m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[Kavach]${NC} $1"; }
warn() { echo -e "${ORANGE}[Kavach]${NC} $1"; }
err()  { echo -e "${RED}[Kavach]${NC} $1"; exit 1; }

echo ""
echo "🛡️  KavachForWork — AI Heat Insurance Setup"
echo "============================================"
echo ""

# ── Check prerequisites ──────────────────────────────────────
command -v node >/dev/null 2>&1  || err "Node.js 20+ required. Install: https://nodejs.org"
command -v python3 >/dev/null 2>&1 || err "Python 3.11+ required."
command -v mongod >/dev/null 2>&1 || warn "MongoDB not found locally. Make sure MongoDB is running or set MONGODB_URI in .env to an Atlas URI."

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
[ "$NODE_VER" -lt 18 ] && err "Node.js 18+ required (found v$NODE_VER)"

log "Node.js $(node -v) ✓"
log "Python $(python3 --version) ✓"

# ── Setup .env ───────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  log ".env created from .env.example"
  warn "Edit .env to set MONGODB_URI and other keys if needed"
else
  log ".env already exists ✓"
fi

# ── Install Node dependencies ─────────────────────────────────
log "Installing root dependencies..."
npm install --silent

log "Installing server dependencies..."
cd server && npm install --silent && cd ..

log "Installing client dependencies..."
cd client && npm install --silent && cd ..

# ── Install Python dependencies ────────────────────────────────
log "Installing Python AI dependencies..."
cd ai
if python3 -m pip install -r requirements.txt -q 2>&1 | tail -1; then
  log "Python packages installed ✓"
else
  warn "pip install had warnings. Trying with --break-system-packages flag..."
  python3 -m pip install -r requirements.txt -q --break-system-packages 2>/dev/null || true
fi
cd ..

# ── Verify ML model ───────────────────────────────────────────
if [ -f ai/sentry_AI_fraud_.joblib ]; then
  log "Sentry ML model found ✓"
else
  err "ML model missing! Expected: ai/sentry_AI_fraud_.joblib"
fi

# ── Seed database ─────────────────────────────────────────────
echo ""
read -p "$(echo -e "${ORANGE}Seed database with demo data? (y/N):${NC} ")" SEED
if [[ "$SEED" =~ ^[Yy]$ ]]; then
  log "Seeding database..."
  cd server
  if node seed.js; then
    log "Database seeded ✓"
  else
    warn "Seed failed — MongoDB may not be running yet. Run 'cd server && node seed.js' manually."
  fi
  cd ..
fi

# ── Launch ────────────────────────────────────────────────────
echo ""
log "Starting all services..."
echo ""
echo "  📱 Frontend:   http://localhost:5173"
echo "  🔧 Backend:    http://localhost:5000"
echo "  🤖 AI Service: http://localhost:8000"
echo "  📖 AI Docs:    http://localhost:8000/docs"
echo ""
echo "  Admin login:   admin@kavachforwork.in / Admin@Kavach2024"
echo "  Demo worker:   9876543210 / Demo@1234"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

npm run dev
