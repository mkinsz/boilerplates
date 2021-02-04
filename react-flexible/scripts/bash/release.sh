#!/bin/bash

# set -o errexit # the same 
set -e

echo '----- release begin -----'
sh version.sh

echo '----- build project -----'
sh build.sh

echo '----- copy & commit -----'
sh copy.sh

echo '----- release end -----'

sh commit.sh

exit 0