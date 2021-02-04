#!/bin/bash

CUR_DIR=$(pwd)
PROJ_DIR=$(dirname $CUR_DIR)
BUILD_DIR=$PROJ_DIR/build

if [ -d "$BUILD_DIR" ]; then
    cd $BUILD_DIR
    tar -zcvf dist.tar.gz *
fi
