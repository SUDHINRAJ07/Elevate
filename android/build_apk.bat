@echo off
set "JAVA_HOME=c:\Users\ADMIN\Music\event calender\event calender\.build-tools\jdk-21.0.12.1+1"
set "ANDROID_HOME=c:\Users\ADMIN\Music\event calender\event calender\.build-tools\android-sdk"
set "GRADLE_USER_HOME=C:\Users\ADMIN\.gradle"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "c:\Users\ADMIN\Music\event calender\event calender\android"
call gradlew.bat assembleRelease assembleDebug --stacktrace
copy /y "c:\Users\ADMIN\Music\event calender\event calender\android\app\build\outputs\apk\debug\app-debug.apk" "c:\Users\ADMIN\Music\event calender\event calender\MEEETLY.apk"
echo APK successfully copied to root folder: MEEETLY.apk
