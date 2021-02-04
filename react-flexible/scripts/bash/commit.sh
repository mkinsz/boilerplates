#!/bin/bash

CUR_DIR=$(pwd)
PROJ_DIR=$(dirname $CUR_DIR)
MAIN_DIR=$(dirname $PROJ_DIR)
ORIGIN_DIR=$(dirname $(dirname $MAIN_DIR))
CODE_DIR=${ORIGIN_DIR}/10-common/version/os/ubuntu/mpuweb/html

CUR_TIME=$(date "+%Y-%m-%d %H:%M:%S")

cd $CODE_DIR

# 添加所有新文件
svn st | grep "? \+" | sed "s/? \+//" | sed 's/\\\/\\//g' | xargs svn add 2> /dev/null

# 删除所有本地缺失的文件
svn st | grep "! \+" | sed "s/! \+//" | sed 's/\\\/\\//g' | xargs svn delete 2> /dev/null

# 提交
svn ci -m "IN 其他 Web版本
修改说明: Web版本更新$CUR_TIME
波及分析: 编译, 运行
平台/产品/模块: Web
自测结果: 通过"