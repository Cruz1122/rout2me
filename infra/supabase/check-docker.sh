#!/bin/bash
# check-docker.sh - Script to verify Docker is running

echo "🐳 Checking Docker installation..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    echo "📥 Please install Docker Desktop: https://docs.docker.com/desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running."
    echo "🚀 Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is installed and running!"
echo "📊 Docker version: $(docker --version)"
echo ""
echo "🎯 Ready to start Supabase local development:"
echo "   pnpm supabase:start"