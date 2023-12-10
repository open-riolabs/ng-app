@echo off
echo Bulding Base App...
call npm run lib:build
echo DONE
echo Bulding App Store...
call npm run store:build
echo DONE
if %errorlevel% neq 0 exit /b %errorlevel%
echo Testing Base App...
call npm run lib:test-ci
echo DONE
echo Testing App Store...
call npm run store:test-ci
echo DONE
if %errorlevel% neq 0 exit /b %errorlevel%
echo Pushing develop...
git push
echo DONE
echo Pushing master...
git checkout master
git merge develop
git push
echo DONE
git checkout develop
echo Ready