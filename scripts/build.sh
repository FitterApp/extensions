#!/bin/bash

# Build script for extensions
# Usage: ./build.sh [extension1] [extension2] ...
# If no extensions specified, builds all extensions

set -e  # Exit on any error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSIONS_DIR="$(dirname "$SCRIPT_DIR")/src"

# Function to print usage
usage() {
    echo "Usage: $0 [extension1] [extension2] ..."
    echo "  If no extensions specified, builds all extensions"
    echo "  Examples:"
    echo "    $0                    # Build all extensions"
    echo "    $0 auth-button        # Build only auth-button"
    echo "    $0 auth-button votes  # Build auth-button and votes"
    exit 1
}

# Function to check if a directory is a valid extension
is_valid_extension() {
    local extension="$1"
    local package_json="$EXTENSIONS_DIR/$extension/package.json"
    [[ -f "$package_json" ]] && [[ ! "$extension" =~ ^_ ]]
}

# Function to get all valid extensions
get_all_extensions() {
    local extensions=()
    for item in "$EXTENSIONS_DIR"/*; do
        if [[ -d "$item" ]]; then
            local name=$(basename "$item")
            if is_valid_extension "$name"; then
                extensions+=("$name")
            fi
        fi
    done
    echo "${extensions[@]}"
}

# Function to build a single extension
build_extension() {
    local extension="$1"
    local extension_path="$EXTENSIONS_DIR/$extension"
    
    echo "📦 Building $extension..."
    
    # Check if package.json exists
    if [[ ! -f "$extension_path/package.json" ]]; then
        echo "❌ Error: $extension/package.json not found"
        return 1
    fi
    
    # Clean the output directory before building
    local out_dir="$EXTENSIONS_DIR/../dist/$extension"
    mkdir -p "$EXTENSIONS_DIR/../dist"
    if [[ -d "$out_dir" ]]; then
        echo "🧹 Cleaning output directory: dist/$extension"
        rm -rf "$out_dir"
    fi
    
    # Run npm install
    echo "📦 Installing dependencies for $extension..."
    (cd "$extension_path" && npm install)
    
    # Run npm build
    echo "🔨 Building $extension..."
    (cd "$extension_path" && npm run build)
    
    echo "✅ $extension built successfully"
}

# Parse command line arguments
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    usage
fi

# Determine which extensions to build
if [[ $# -eq 0 ]]; then
    # Build all extensions
    extensions=($(get_all_extensions))
    if [[ ${#extensions[@]} -eq 0 ]]; then
        echo "❌ No valid extensions found"
        exit 1
    fi
else
    # Build specified extensions
    extensions=("$@")
    
    # Validate that all specified extensions exist
    for extension in "${extensions[@]}"; do
        if ! is_valid_extension "$extension"; then
            echo "❌ Error: '$extension' is not a valid extension"
            echo "Valid extensions: $(get_all_extensions)"
            exit 1
        fi
    done
fi

echo "Building ${#extensions[@]} extension(s): ${extensions[*]}"
echo "NODE_ENV: ${NODE_ENV:-development}"

# Build each extension
for extension in "${extensions[@]}"; do
    if ! build_extension "$extension"; then
        echo "❌ Failed to build $extension"
        exit 1
    fi
    echo ""
done

echo "🎉 All extensions built successfully!" 