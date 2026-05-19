-- Migration 006: Per-slice wheel config for SpinWheel
-- Jalankan di Supabase SQL Editor

-- Tambah kolom wheel_config (jsonb) untuk menyimpan konfigurasi tiap irisan roda
-- Format: [{ id, label, color, emoji, celoAmount }, ...]
alter table spin_sessions
  add column if not exists wheel_config jsonb;

-- Contoh isi wheel_config:
-- [
--   { "id": 1, "label": "Jackpot", "color": "#35D07F", "emoji": "💰", "celoAmount": 0.5 },
--   { "id": 2, "label": "Coba Lagi", "color": "#6B7280", "emoji": "🔄", "celoAmount": 0 },
--   { "id": 3, "label": "Mini Prize", "color": "#60A5FA", "emoji": "🎁", "celoAmount": 0.01 }
-- ]
