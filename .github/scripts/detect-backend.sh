#!/usr/bin/env bash
set -euo pipefail

ROOT=$(pwd)
RESULT='{'
echo "{\"path\": \"$ROOT\", \"detected\": []}" > detection.json.tmp

DETECTED=false
detect_append() {
  jq --arg item "$1" '.detected += [$item]' detection.json.tmp > detection.json.tmp2 && mv detection.json.tmp2 detection.json.tmp
  DETECTED=true
}

if [ -f package.json ]; then
  detect_append "nodejs"
fi
if [ -f requirements.txt ] || ls *.py 1>/dev/null 2>&1; then
  detect_append "python"
fi
if [ -f pom.xml ] || [ -f build.gradle ]; then
  detect_append "java"
fi
if [ -f main.go ] || ls *.go 1>/dev/null 2>&1; then
  detect_append "go"
fi
if [ -f Gemfile ]; then
  detect_append "ruby"
fi
if [ -f composer.json ]; then
  detect_append "php"
fi

if [ "$DETECTED" = false ]; then
  detect_append "unknown"
fi

jq '.' detection.json.tmp > detection.json
cat detection.json
rm -f detection.json.tmp
