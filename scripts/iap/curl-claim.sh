#!/bin/bash
# Claim purchase test script

set -e

# Configuration
SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
CLAIM_URL="$SUPABASE_URL/functions/v1/claim"
ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key-here}"

# Parameters
SKU="${1:-consumable_streakshield_1}"
TX_ID="${2:-test-claim-$(date +%s)}"
TEST_USER="${3:-test-user-1}"

echo "Testing claim endpoint..."
echo "URL: $CLAIM_URL"
echo "SKU: $SKU"
echo "TX_ID: $TX_ID"
echo "Test User: $TEST_USER"

# Claim request payload
PAYLOAD="{
  \"sku\": \"$SKU\",
  \"tx_id\": \"$TX_ID\"
}"

echo "Payload: $PAYLOAD"

# Send claim request
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "x-test-user: $TEST_USER" \
  -d "$PAYLOAD" \
  "$CLAIM_URL")

# Parse response
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
RESPONSE_BODY=$(echo "$RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')

echo "Response status: $HTTP_STATUS"
echo "Response body: $RESPONSE_BODY"

case $HTTP_STATUS in
  200)
    echo "✅ Claim test PASSED - Purchase claimed successfully"
    ;;
  409)
    echo "⚠️  Claim test - Cap exceeded (expected for multiple attempts)"
    ;;
  *)
    echo "❌ Claim test FAILED"
    exit 1
    ;;
esac

echo ""
echo "Testing idempotency - claiming same TX_ID again..."

# Test idempotency with same TX_ID
RESPONSE2=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "x-test-user: $TEST_USER" \
  -d "$PAYLOAD" \
  "$CLAIM_URL")

HTTP_STATUS2=$(echo "$RESPONSE2" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
echo "Idempotency test status: $HTTP_STATUS2"

if [ "$HTTP_STATUS2" -eq 200 ]; then
  echo "✅ Idempotency test PASSED - Same TX_ID returned consistent result"
else
  echo "❌ Idempotency test FAILED"
  exit 1
fi