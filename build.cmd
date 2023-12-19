@echo off
echo Bulding Base App...
call npm run lib:build
echo DONE
if %errorlevel% neq 0 exit /b %errorlevel%
echo Testing Base App...
call npm run lib:test-ci
echo DONE
