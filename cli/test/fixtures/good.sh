#!/usr/bin/env bash
# Clean shell script — shellcheck should pass

FILES="*.txt"

cd /tmp || exit 1
echo "${FILES}"
