#!/usr/bin/env bash
# Copies the keys from .env.local to the Vercel project (production) and redeploys.
# Values are never printed. Run from the funcoin-lab folder: bash scripts/push-env-vercel.sh
set -euo pipefail
cd "$(dirname "$0")/.."

SITE_URL="${SITE_URL:-https://funcoinlab.com}"
APP_URL="${APP_URL:-https://app.funcoinlab.com}"
VARS=(OPENAI_API_KEY IMAGE_PROVIDER IMAGE_MODEL
  NEXT_PUBLIC_SOLANA_CLUSTER SOLANA_RPC_URL MERCHANT_SOLANA_ADDRESS NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
  NOWPAYMENTS_API_KEY NOWPAYMENTS_IPN_SECRET NOWPAYMENTS_SANDBOX
  SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY
  DOMAIN_PROVIDER DYNADOT_API_KEY DYNADOT_SANDBOX NEXT_PUBLIC_DOMAIN_AFFILIATE_URL_TEMPLATE NEXT_PUBLIC_REGISTRAR_NAME
  NEXT_PUBLIC_X_URL NEXT_PUBLIC_TELEGRAM_URL NEXT_PUBLIC_DISCORD_URL NEXT_PUBLIC_GITHUB_URL NEXT_PUBLIC_INSTAGRAM_URL
  NEXT_PUBLIC_TIKTOK_URL NEXT_PUBLIC_YOUTUBE_URL NEXT_PUBLIC_TOKEN_NAME NEXT_PUBLIC_TOKEN_TICKER NEXT_PUBLIC_TOKEN_CA
  NEXT_PUBLIC_PUMPFUN_URL NEXT_PUBLIC_DEX_URL NEXT_PUBLIC_JUPITER_URL NEXT_PUBLIC_COINGECKO_URL NEXT_PUBLIC_CMC_URL
  ADMIN_URL ADMIN_WALLETS ADMIN_SESSION_SECRET ADMIN_IP_ALLOWLIST
  NEXT_PUBLIC_LEGAL_ENTITY NEXT_PUBLIC_LEGAL_ADDRESS NEXT_PUBLIC_LEGAL_COUNTRY NEXT_PUBLIC_GOVERNING_LAW NEXT_PUBLIC_DISPUTE_VENUE
  NEXT_PUBLIC_PRIVACY_EMAIL NEXT_PUBLIC_COPYRIGHT_EMAIL NEXT_PUBLIC_MIN_AGE RESTRICTED_COUNTRIES)

set -a; . ./.env.local; set +a

put() {
  npx -y vercel@latest env rm "$1" production --yes >/dev/null 2>&1 || true
  printf '%s' "$2" | npx -y vercel@latest env add "$1" production >/dev/null 2>&1 && echo "set  $1" || echo "FAIL $1"
}

for name in "${VARS[@]}"; do
  value="${!name:-}"
  if [ -n "$value" ]; then put "$name" "$value"; else echo "skip $name (empty)"; fi
done
put NEXT_PUBLIC_SITE_URL "$SITE_URL"
put NEXT_PUBLIC_APP_URL "$APP_URL"
# Production gets its own session secret, created once (changing it later signs everyone out).
if npx -y vercel@latest env ls production 2>/dev/null | grep -q "SESSION_SECRET"; then
  echo "keep SESSION_SECRET"
else
  put SESSION_SECRET "$(openssl rand -base64 36 | tr -d '/+=\n')"
fi

npx -y vercel@latest deploy --prod --yes
