#!/bin/bash
# cPanel deployment script for PlayBeat Digital.
# Run this on the cPanel server after pulling the latest code via Git.
#
# Usage:
#   cd /home/jxfdmejtgt/Newnew
#   bash deploy.sh
#
# This script:
#   1. Installs Node.js dependencies
#   2. Generates the Prisma client
#   3. Builds the Next.js app for production
#   4. Restarts the Node.js app (via Passenger)

set -e

echo "=== PlayBeat Digital Deployment ==="
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"
echo ""

# Step 1: Install dependencies
echo "[1/4] Installing dependencies..."
npm install --production=false

# Step 2: Generate Prisma client
echo "[2/4] Generating Prisma client..."
npx prisma generate

# Step 3: Build Next.js for production
echo "[3/4] Building Next.js..."
NODE_ENV=production npx next build

# Step 4: Restart the app
echo "[4/4] Build complete!"
echo ""
echo "To restart the Node.js app:"
echo "  cPanel → Software → Setup Node.js App → Restart"
echo ""
echo "Or via terminal:"
echo "  touch /home/jxfdmejtgt/Newnew/tmp/restart.txt"
echo ""
echo "=== Deployment ready ==="
