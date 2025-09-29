#!/bin/bash

# AskTennis - Run with Increased Memory
# This script runs the server with increased memory allocation

echo "🎾 Starting AskTennis with increased memory allocation..."

# Set Node.js memory options
export NODE_OPTIONS="--max-old-space-size=8192 --expose-gc"

# Start the server
node server.js
