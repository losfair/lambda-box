#!/bin/bash

set -e

CONFIG_PATH="$1"
S3_BUCKET="$2"

if [ -z "$CONFIG_PATH" ]; then
  echo "[-] Missing config path"
  exit 1
fi

if [ -z "$S3_BUCKET" ]; then
  S3_BUCKET="test"
fi

./build.sh
RUST_LOG=info S3CMD_CFG=$CONFIG_PATH/s3.config ../rwv2/scripts/build_and_upload.mjs \
  -f ./lambda-box-build.tar \
  --mysql $CONFIG_PATH/mysql.json \
  --env $CONFIG_PATH/env.json \
  --s3_bucket "$S3_BUCKET" --s3_prefix lambda-box/
