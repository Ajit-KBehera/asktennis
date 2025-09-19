#!/bin/bash

# AskTennis Deployment Script
echo "🎾 Deploying AskTennis to GitHub Pages..."

# Navigate to client directory
cd client

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to GitHub Pages
echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo "✅ Deployment complete!"
echo "🌐 Your site will be live at: https://ajit-kbehera.github.io/asktennis/"
echo "⏱️  It may take 2-3 minutes for changes to appear."
