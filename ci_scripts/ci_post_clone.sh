#!/bin/sh
set -e

# Xcode Cloud runs xcodebuild against a fresh clone of the repo. Our
# iOS project's Swift Package Manager dependencies live inside
# node_modules/@capacitor/*, so we need to install npm packages and run
# `cap sync` BEFORE Xcode tries to resolve packages — otherwise the
# build fails with "the package at node_modules/@capacitor/... cannot
# be accessed".

cd "$CI_WORKSPACE"

echo "Installing npm dependencies..."
npm ci

echo "Building Next.js mobile bundle..."
npm run build:mobile

echo "Syncing iOS bundle (Capacitor)..."
npx cap sync ios
