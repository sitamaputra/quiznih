#!/usr/bin/env bash
#
# Setup script untuk Celo Composer minipay template
# Jalankan dari root project (folder yang punya apps/web dan apps/contracts):
#   bash setup.sh
#
# Script ini:
#   1. Cek prerequisites (forge, pnpm, node)
#   2. Install forge-std untuk Foundry
#   3. Buat remappings.txt
#   4. Verify forge test pass
#   5. Setup .env.local untuk frontend
#   6. Install pnpm dependencies

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------- 0. Verify project structure ----------
if [ ! -d "apps/web" ] || [ ! -d "apps/contracts" ]; then
  error "Folder apps/web atau apps/contracts tidak ditemukan."
  error "Jalankan script ini dari root project Celo Composer (folder yang punya apps/web dan apps/contracts)."
  exit 1
fi

ROOT_DIR="$(pwd)"
info "Setup dimulai di: $ROOT_DIR"
echo ""

# ---------- 1. Check prerequisites ----------
info "Cek prerequisites..."

if ! command -v node &> /dev/null; then
  error "Node.js belum ke-install. Install dari https://nodejs.org (versi >= 18)"
  exit 1
fi
NODE_VERSION=$(node -v)
success "Node.js $NODE_VERSION"

if ! command -v pnpm &> /dev/null; then
  warn "pnpm belum ke-install. Installing via npm..."
  npm install -g pnpm
fi
success "pnpm $(pnpm -v)"

if ! command -v forge &> /dev/null; then
  error "Foundry (forge) belum ke-install."
  error "Install via: curl -L https://foundry.paradigm.xyz | bash && foundryup"
  exit 1
fi
success "Foundry $(forge --version | head -1)"
echo ""

# ---------- 2. Setup Foundry contracts ----------
info "Setup Foundry contracts..."
cd "$ROOT_DIR/apps/contracts"

if [ ! -d "lib/forge-std" ]; then
  info "Installing forge-std library..."
  forge install foundry-rs/forge-std
  success "forge-std installed"
else
  success "forge-std sudah ada, skip install"
fi

if [ ! -f "remappings.txt" ]; then
  info "Membuat remappings.txt..."
  echo "forge-std/=lib/forge-std/src/" > remappings.txt
  success "remappings.txt dibuat"
else
  success "remappings.txt sudah ada, skip"
fi

info "Verify dengan forge test..."
if forge test > /tmp/forge-test.log 2>&1; then
  success "Foundry tests pass — contracts siap"
else
  error "forge test gagal. Cek /tmp/forge-test.log"
  tail -20 /tmp/forge-test.log
  exit 1
fi
echo ""

# ---------- 3. Setup frontend env ----------
info "Setup frontend env..."
cd "$ROOT_DIR/apps/web"

if [ ! -f ".env.local" ]; then
  info "Membuat .env.local..."
  cat > .env.local <<'EOF'
# Celo RPC
CELO_RPC_URL=https://forno.celo.org

# WalletConnect Project ID — daftar gratis di https://cloud.walletconnect.com
# CATATAN: minipay template butuh nama variable NEXT_PUBLIC_WC_PROJECT_ID
# (bukan NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID seperti di .env.template)
NEXT_PUBLIC_WC_PROJECT_ID=your_project_id_here
EOF
  success ".env.local dibuat"
  warn "PENTING: edit apps/web/.env.local — ganti 'your_project_id_here' dengan WalletConnect Project ID kamu"
  warn "Daftar gratis di: https://cloud.walletconnect.com"
else
  success ".env.local sudah ada, skip"
  if grep -q "your_project_id_here" .env.local 2>/dev/null; then
    warn "NEXT_PUBLIC_WC_PROJECT_ID di .env.local masih placeholder — jangan lupa di-edit!"
  fi
fi
echo ""

# ---------- 4. Install dependencies ----------
cd "$ROOT_DIR"
info "Install pnpm dependencies (bisa makan beberapa menit)..."
pnpm install
success "Dependencies installed"
echo ""

# ---------- 5. Done ----------
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup selesai!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Langkah selanjutnya:"
echo "  1. Edit apps/web/.env.local — isi NEXT_PUBLIC_WC_PROJECT_ID"
echo "     (daftar gratis di https://cloud.walletconnect.com)"
echo ""
echo "  2. Jalankan dev server:"
echo "     pnpm dev"
echo ""
echo "  3. Buka http://localhost:3000 di browser"
echo ""
echo "Smart contracts:"
echo "  cd apps/contracts"
echo "  forge test                # run tests"
echo "  forge build               # compile contracts"
echo ""
