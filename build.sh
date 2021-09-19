#!/bin/bash

set -e

npm run build

TMP="$(mktemp --suffix=-lambda-box-build -d)"

cleanup()
{
    echo "Cleaning up temporary directory $TMP"
    rm -r "$TMP"
}

trap cleanup EXIT

cp "./dist/main.js" "$TMP/index.js"
cp -r ./res "$TMP/" 
find res -type f > "$TMP/static.txt"

cd "$TMP" || exit 1
tar c . > "$OLDPWD/lambda-box-build.tar" || exit 1

echo "[+] Built lambda-box-build.tar"
