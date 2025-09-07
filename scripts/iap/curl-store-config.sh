#!/bin/bash
# Store config (feature flags) test script

set -e

# Configuration  
SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
CONFIG_URL="$SUPABASE_URL/rest/v1/store_config"
ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key-here}"

echo "Testing store config endpoint..."
echo "URL: $CONFIG_URL"

# Get all store config
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  "$CONFIG_URL?select=*")

# Parse response
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
RESPONSE_BODY=$(echo "$RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')

echo "Response status: $HTTP_STATUS"
echo "Response body: $RESPONSE_BODY"

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "✅ Store config test PASSED"
  
  # Parse and display config values
  echo ""
  echo "Config values:"
  echo "$RESPONSE_BODY" | jq -r '.[] | "  \(.key): \(.value)"' 2>/dev/null || echo "  (raw JSON above)"
  
  # Check for required keys
  REQUIRED_KEYS=("storefront_enabled" "paywall_enabled" "sku_enabled")
  for key in "${REQUIRED_KEYS[@]}"; do
    if echo "$RESPONSE_BODY" | grep -q "\"$key\""; then
      echo "✅ Required key '$key' found"
    else
      echo "❌ Required key '$key' missing"
    fi
  done
  
else
  echo "❌ Store config test FAILED"
  exit 1
fi