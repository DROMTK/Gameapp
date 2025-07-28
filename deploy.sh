#!/bin/bash

# PlayMate Deployment Script
# This script helps deploy the PlayMate app to various platforms

echo "🎮 PlayMate Deployment Script"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "index.html" ] || [ ! -f "app.js" ]; then
    echo "❌ Error: Please run this script from the PlayMate project root directory"
    exit 1
fi

# Function to validate the app
validate_app() {
    echo "🔍 Validating PlayMate app..."
    
    # Check required files
    required_files=("index.html" "games.html" "app.js" "games.js" "serviceWorker.js" "manifest.json" "assets/styles.css")
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo "❌ Missing required file: $file"
            return 1
        fi
    done
    
    # Check games directory
    if [ ! -d "games" ]; then
        echo "❌ Missing games directory"
        return 1
    fi
    
    # Count game files
    game_count=$(ls games/*.html 2>/dev/null | wc -l)
    if [ "$game_count" -lt 10 ]; then
        echo "⚠️  Warning: Only $game_count game files found (expected 10)"
    else
        echo "✅ Found $game_count game files"
    fi
    
    echo "✅ App validation complete"
    return 0
}

# Function to build for production
build_production() {
    echo "🏗️  Building for production..."
    
    # Create dist directory
    mkdir -p dist
    
    # Copy all files to dist
    cp -r * dist/ 2>/dev/null || true
    
    # Remove development files
    rm -f dist/deploy.sh
    rm -f dist/README.md
    
    echo "✅ Production build complete in 'dist' directory"
}

# Function to test locally
test_local() {
    echo "🧪 Testing locally..."
    
    # Check if Python is available
    if command -v python3 &> /dev/null; then
        echo "🚀 Starting local server with Python..."
        echo "📱 Open http://localhost:8000 in your browser"
        echo "⏹️  Press Ctrl+C to stop the server"
        python3 -m http.server 8000
    elif command -v python &> /dev/null; then
        echo "🚀 Starting local server with Python..."
        echo "📱 Open http://localhost:8000 in your browser"
        echo "⏹️  Press Ctrl+C to stop the server"
        python -m http.server 8000
    else
        echo "❌ Python not found. Please install Python to test locally."
        echo "💡 Alternative: Use any local server like 'npx serve .'"
    fi
}

# Function to deploy to GitHub Pages
deploy_github_pages() {
    echo "🚀 Deploying to GitHub Pages..."
    
    if [ ! -d ".git" ]; then
        echo "❌ Error: Not a git repository. Please initialize git first."
        return 1
    fi
    
    # Create .github/workflows directory
    mkdir -p .github/workflows
    
    # Create GitHub Actions workflow
    cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: .
EOF
    
    echo "✅ GitHub Pages workflow created"
    echo "📝 Next steps:"
    echo "   1. Push this repository to GitHub"
    echo "   2. Go to Settings > Pages"
    echo "   3. Select 'Deploy from a branch'"
    echo "   4. Choose 'gh-pages' branch"
    echo "   5. Your app will be available at: https://[username].github.io/[repo-name]"
}

# Function to deploy to Netlify
deploy_netlify() {
    echo "🚀 Preparing for Netlify deployment..."
    
    # Create netlify.toml
    cat > netlify.toml << 'EOF'
[build]
  publish = "."
  command = "echo 'No build command needed'"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF
    
    echo "✅ Netlify configuration created"
    echo "📝 Next steps:"
    echo "   1. Push this repository to GitHub"
    echo "   2. Go to https://netlify.com"
    echo "   3. Click 'New site from Git'"
    echo "   4. Connect your GitHub repository"
    echo "   5. Deploy settings are already configured"
}

# Function to show deployment options
show_deployment_options() {
    echo ""
    echo "🚀 Deployment Options:"
    echo "======================"
    echo "1. Test locally"
    echo "2. Build for production"
    echo "3. Deploy to GitHub Pages"
    echo "4. Deploy to Netlify"
    echo "5. Deploy to Vercel"
    echo "6. Validate app only"
    echo "7. Exit"
    echo ""
    read -p "Choose an option (1-7): " choice
    
    case $choice in
        1) test_local ;;
        2) build_production ;;
        3) deploy_github_pages ;;
        4) deploy_netlify ;;
        5) echo "📝 For Vercel: Push to GitHub and connect at https://vercel.com" ;;
        6) validate_app ;;
        7) echo "👋 Goodbye!"; exit 0 ;;
        *) echo "❌ Invalid option"; show_deployment_options ;;
    esac
}

# Main script
echo ""
echo "What would you like to do?"
echo ""

# Validate the app first
if validate_app; then
    show_deployment_options
else
    echo "❌ App validation failed. Please fix the issues above."
    exit 1
fi 