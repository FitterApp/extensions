#!/bin/bash

# Usage: ./create-extension.sh <extension-name>
# Example: ./create-extension.sh random-cats

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <extension-name>"
  exit 1
fi

EXT_NAME="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR" && cd .. && pwd)"
TEMPLATE_DIR="$ROOT_DIR/templates/vue-extension"
TARGET_DIR="$ROOT_DIR/src/$EXT_NAME"

# Convert extension name to CamelCase for component name
COMPONENT_NAME=$(echo "$EXT_NAME" | sed -r 's/(^|-)([a-z])/\U\2/g')

if [ -d "$TARGET_DIR" ]; then
  echo "❌ Error: $TARGET_DIR already exists. Aborting."
  exit 1
fi

# Create the target directory
mkdir -p "$TARGET_DIR"

# Copy all files, including hidden ones, from the template
cp -r "$TEMPLATE_DIR"/. "$TARGET_DIR"/

# Rename files inside src/
cd "$TARGET_DIR/src"
if [ -f "vue-extension.ts" ]; then
  mv vue-extension.ts "$EXT_NAME.ts"
fi
if [ -f "VueExtension.vue" ]; then
  mv VueExtension.vue "$COMPONENT_NAME.vue"
fi
cd "$SCRIPT_DIR"

# Rename CSS file
if [ -f "$TARGET_DIR/src/assets/vue-extension.css" ]; then
  mv "$TARGET_DIR/src/assets/vue-extension.css" "$TARGET_DIR/src/assets/$EXT_NAME.css"
fi

# Update references in files
find "$TARGET_DIR" -type f \( -name "*.*" \) -exec sed -i \
  -e "s/vue-extension/$EXT_NAME/g" \
  -e "s/VueExtension/$COMPONENT_NAME/g" \
  {} +

# Success message
echo "✅ Extension template created at $TARGET_DIR with component $COMPONENT_NAME"
