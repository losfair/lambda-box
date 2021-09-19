#!/bin/bash

set -e

./build.sh
RUST_LOG=info S3CMD_CFG=../lambda-box-deploy-rwv2/s3.config ../rwv2/scripts/build_and_upload.mjs \
  -f ./lambda-box-build.tar \
  --mysql ../lambda-box-deploy-rwv2/mysql.json \
  --mkimage ../rwv2/bin/mkimage/ \
  --env ../lambda-box-deploy-rwv2/env.json \
  --s3_bucket test --s3_prefix /lambda-box/ \
  --lazy
