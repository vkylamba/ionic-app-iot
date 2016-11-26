#!/bin/bash
# fail if any commands fails
set -e
# debug log
set -x

# write your script here
echo y | android update sdk --no-ui --all --filter extra-android-support | grep 'package installed'
echo y | android update sdk --no-ui --all --filter extra-android-m2repository | grep 'package installed'
echo y | android update sdk --no-ui --all --filter extra-google-m2repository | grep 'package installed'

