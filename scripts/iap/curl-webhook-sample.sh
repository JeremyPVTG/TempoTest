#!/bin/bash
# RevenueCat webhook test with proper HMAC signature

set -e

# Configuration
SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
WEBHOOK_SECRET="${REVENUECAT_WEBHOOK_SECRET:-dev-secret}"
WEBHOOK_URL="$SUPABASE_URL/functions/v1/revenuecat-webhook"

# Sample webhook payload
PAYLOAD='{
  "id": "test-tx-12345",
  "type": "INITIAL_PURCHASE", 
  "app_user_id": "test-user-pro",
  "product_id": "pro_month",
  "store": "APP_STORE",
  "purchased_at_ms": '$(date +%s000)',
  "price": 999,
  "currency": "USD"
}'

echo "Testing RevenueCat webhook..."
echo "URL: $WEBHOOK_URL"
echo "Payload: $PAYLOAD"

# Generate HMAC-SHA256 signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -binary | base64)

echo "Generated signature: $SIGNATURE"

# Send webhook request
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-RevenueCat-Signature: $SIGNATURE" \
  -d "$PAYLOAD" \
  "$WEBHOOK_URL")

# Parse response
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
RESPONSE_BODY=$(echo "$RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')

echo "Response status: $HTTP_STATUS"
echo "Response body: $RESPONSE_BODY"

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "✅ Webhook test PASSED"
else
  echo "❌ Webhook test FAILED"
  exit 1
fi