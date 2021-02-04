#!/bin/bash

SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
ENV_PATH=$(dirname "$SCRIPTPATH")

BAS_VER='0.0.'
ENV_FILE=$ENV_PATH'/.env.local'

GIT_VER=`(git --version)`
GIT_LOG=`(git log --pretty=format:%H%ai%ci -1)`
CUR_TIME=$(date "+%Y-%m-%d %H:%M:%S")
IS_GIT_REPO=`(git rev-parse --is-inside-work-tree)`

if [[ $IS_GIT_REPO == true ]]; then
    echo 'success! git repo found...'

    GIT_SHA1=`(git show-ref --head --hash=8 2> /dev/null || echo 00000000) | head -n1`
    GIT_DIRTY=`git diff --no-ext-diff 2> /dev/null | wc -l`

    test -f $ENV_FILE || touch $ENV_FILE
    (cat $ENV_FILE | grep SHA1 | grep $GIT_SHA1) && \
    (cat $ENV_FILE | grep DIRTY | grep $GIT_DIRTY) &&  exit 0    //already up-to-date

    if [ ! -x "$ENV_FILE" ]; then
        rm -f $ENV_FILE
    fi

    echo "PROJ_COMMIT_SHA1=\"${GIT_SHA1}\"" >> $ENV_FILE
    echo "PROJ_DIFF_DIRTY=\"${GIT_DIRTY}\"" >> $ENV_FILE
    echo "PROJ_BUILD_TIME=\"${CUR_TIME}\"" >> $ENV_FILE
    echo "PROJ_COMMIT_ID=\"${GIT_LOG: 0:40}\"" >> $ENV_FILE
    echo "PROJ_COMMIT_TIME=\"${GIT_LOG: 65}\"" >> $ENV_FILE

else
    echo 'sorry! no git repo...'
fi




