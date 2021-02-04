#!/bin/bash

# echo "$0: "$0
# echo "============================="

# shell_path=$(cd "$(dirname "$0")";pwd)
# echo $shell_path

CUR_DIR=$(pwd)
PROJ_DIR=$(dirname $(pwd))
MAIN_DIR=$(dirname $PROJ_DIR)
ORIGIN_DIR=$(dirname $(dirname $MAIN_DIR))

SRC_DIR=${PROJ_DIR}/build
DST_DIR=${ORIGIN_DIR}/10-common/version/os/ubuntu/mpuweb/html

if [ -d "$DST_DIR" -a -d "$SRC_DIR" ]; then
    echo $ORIGIN_DIR
    echo $SRC_DIR
    echo $DST_DIR

    rm -rf ${DST_DIR}/*
    cp ${SRC_DIR}/dist.tar.gz ${DST_DIR}/dist.tar.gz

    cd $DST_DIR
    tar -xvzf dist.tar.gz
    rm -rf dist.tar.gz
fi