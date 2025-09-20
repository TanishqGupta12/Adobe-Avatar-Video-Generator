#!/bin/bash

# Test script for Adobe Avatar API
# Make sure to set your environment variables before running:
# export ADOBE_ACCESS_TOKEN="your_token_here"
# export ADOBE_CLIENT_ID="your_client_id_here"

echo "Testing Adobe Avatar API endpoints..."
echo "======================================"

if [ -z "$ADOBE_ACCESS_TOKEN" ]; then
    echo "❌ ADOBE_ACCESS_TOKEN not set. Please set it first:"
    echo "   export ADOBE_ACCESS_TOKEN='your_token_here'"
    exit 1
fi

if [ -z "$ADOBE_CLIENT_ID" ]; then
    echo "❌ ADOBE_CLIENT_ID not set. Please set it first:"
    echo "   export ADOBE_CLIENT_ID='your_client_id_here'"
    exit 1
fi

echo "✅ Environment variables are set"
echo ""

echo "Testing /avatars endpoint..."
echo "---------------------------"
curl -X GET "https://audio-video-api.adobe.io/v1/avatars" \
  -H "Authorization: Bearer $ADOBE_ACCESS_TOKEN" \
  -H "x-api-key: $ADOBE_CLIENT_ID" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "Testing /voices endpoint..."
echo "--------------------------"
curl -X GET "https://audio-video-api.adobe.io/v1/voices" \
  -H "Authorization: Bearer $ADOBE_ACCESS_TOKEN" \
  -H "x-api-key: $ADOBE_CLIENT_ID" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "Test completed!"
