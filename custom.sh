#!/bin/bash
TESTS=""

for TEST in "$@"
do
    TESTS+=","$TEST
done

TESTS=$(echo $TESTS | cut -c 2-)

./node_modules/babel-cli/bin/babel.js src --presets babel-preset-es2015 --out-dir dist && ./node_modules/casperjs/bin/casperjs test --log-level=debug dist/run.js --testFiles=$TESTS