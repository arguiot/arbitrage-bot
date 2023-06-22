#!/bin/bash

ZIG_BIN_PATH=$(which zig)
ZIG_REAL_PATH=$(realpath "$ZIG_BIN_PATH")
ZIG_INCLUDE_PATH=$(dirname $(dirname "$ZIG_REAL_PATH"))/lib
PROJECT_INCLUDE_PATH="Sources/PriceDataStore/product"


ln -sf "$ZIG_INCLUDE_PATH/zig.h" "$PROJECT_INCLUDE_PATH/zig.h"
