# stop if cmake version below 2.8
cmake_minimum_required(VERSION 2.8 FATAL_ERROR)

# project name
set(project_name server)

include_directories(../asio-1.10.6/include)

file(GLOB SRC_HTTP "*.h" "*.hpp" "*.cpp")
file(GLOB SRC_DB "${CMAKE_CURRENT_SOURCE_DIR}/../sqlite-amalgamation-3210000/sqlite3.h" "${CMAKE_CURRENT_SOURCE_DIR}/../sqlite-amalgamation-3210000/sqlite3.c")
source_group(http FILES ${SRC_HTTP})
source_group(sqlite FILES ${SRC_DB})
add_definitions(-DASIO_STANDALONE)
add_executable(${project_name} ${SRC_HTTP} ${SRC_DB})
if (MSVC)
else()	
target_link_libraries(${project_name} pthread dl)
endif()

include(InstallRequiredSystemLibraries)
message("************************")
message(${CMAKE_INSTALL_SYSTEM_RUNTIME_LIBS})
message("************************")
install (TARGETS ${project_name} RUNTIME DESTINATION . COMPONENT application)
install(FILES ${CMAKE_INSTALL_SYSTEM_RUNTIME_LIBS} DESTINATION . COMPONENT libraries)

set(CPACK_PACKAGE_NAME ${project_name})
set(CPACK_PACKAGE_VENDOR "scu")
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "server - CPack Component Installation Example")
set(CPACK_PACKAGE_VERSION "1.0.0")
set(CPACK_PACKAGE_VERSION_MAJOR "1")
set(CPACK_PACKAGE_VERSION_MINOR "0")
set(CPACK_PACKAGE_VERSION_PATCH "0")
set(CPACK_PACKAGE_INSTALL_DIRECTORY "server")
set(CPACK_COMPONENTS_ALL application libraries html)
# This must always be last!
include(CPack)
