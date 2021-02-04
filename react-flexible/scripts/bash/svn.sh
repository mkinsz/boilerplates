#!/bin/bash

# Current Subversion revision command: 
# https://stackoverflow.com/questions/1991526/current-subversion-revision-command

SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")

svn info --show-item revision

# svn info |grep Revision: |awk '{print $2}'
