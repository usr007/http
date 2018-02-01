# stop if cmake version below 2.8
cmake_minimum_required(VERSION 2.8 FATAL_ERROR)

# project name
project(http_server)

# enable  c, and c++ language
enable_language(C CXX)

set_property(GLOBAL PROPERTY USE_FOLDERS ON)
set (CMAKE_CXX_STANDARD 11)
add_subdirectory(server)
add_subdirectory(server_threaded)
install (DIRECTORY doc_root DESTINATION . COMPONENT html)
