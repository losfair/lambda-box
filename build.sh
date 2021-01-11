#!/bin/sh

npm run build || exit 1

TMP="/tmp/qbox-build-`uuidgen || exit 1`"
mkdir "$TMP" || exit 1

cleanup()
{
    echo "Cleaning up temporary directory $TMP"
    rm -r "$TMP"
}

trap cleanup EXIT

cp "./dist/main.js" "$TMP/index.js" || exit 1
cp -r ./res "$TMP/" || exit 1
CURDIR="`pwd`"
cd "$TMP" || exit 1
tar c . > "$CURDIR/qbox-build.tar" || exit 1
cd "$CURDIR" || exit 1

echo "[+] Built qbox-build.tar"
