cmake_minimum_required(VERSION 3.15)
project(Arbitrage-Bot LANGUAGES Swift C)

set(CMAKE_Swift_LANGUAGE_VERSION 5.9)

add_library(Arbitrer Sources/Arbitrer/ArbitrerInterface.swift)
set_target_properties(Arbitrer PROPERTIES
    Swift_MODULE_DIRECTORY ${CMAKE_BINARY_DIR}/swift)

add_executable(PriceDataStore Sources/PriceDataStore/main.c)
target_include_directories(PriceDataStore PRIVATE ${CMAKE_BINARY_DIR}/swift)
target_link_libraries(PriceDataStore Arbitrer)
