# stop if cmake version below 2.8
cmake_minimum_required(VERSION 2.8 FATAL_ERROR)

# project name
set(project_name server_threaded)

include_directories(../asio-1.10.6/include)

file(GLOB SRC_HTTP "*.h" "*.hpp" "*.cpp")
file(GLOB SRC_DB "${CMAKE_CURRENT_SOURCE_DIR}/../sqlite-amalgamation-3210000/sqlite3.h" "${CMAKE_CURRENT_SOURCE_DIR}/../sqlite-amalgamation-3210000/sqlite3.c")
source_group(http FILES ${SRC_HTTP})
source_group(sqlite FILES ${SRC_DB})
add_definitions(-DASIO_STANDALONE)
add_executable(${project_name} ${SRC_HTTP} ${SRC_DB})
target_link_libraries(${project_name} pthread dl)