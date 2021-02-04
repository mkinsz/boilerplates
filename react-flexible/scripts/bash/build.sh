#!/bin/bash

# echo $PATH

CUR_DIR=$(pwd)
PROJ_DIR=$(dirname $(pwd))
BUILD_DIR=${PROJ_DIR}/build
DEPEND_DIR=${PROJ_DIR}/node_modules

if [ ! -d "$DEPEND_DIR" ]; then
    node -v
    npm -v
    npm install
fi

if [ -d "${BUILD_DIR}" ]; then
    rm -rf $BUILD_DIR
fi

npm run build

cd $BUILD_DIR
tar -zcvf dist.tar.gz *
