#!/usr/bin/env bash
# Bad shell script — intentional issues for testing
# SC2164: bare cd (no || exit)
# SC2086: unquoted variable

FILES="*.txt"

cd /tmp
echo $FILES
