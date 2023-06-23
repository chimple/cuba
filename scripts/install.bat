@ECHO OFF


PATH=%PATH%;"%SYSTEMROOT%\System32"
adb install cuba.apk
adb shell pm grant org.chimple.cuba android.permission.WRITE_EXTERNAL_STORAGE
adb shell appops set --uid org.chimple.cuba MANAGE_EXTERNAL_STORAGE allow
adb shell monkey -p org.chimple.cuba -c android.intent.category.LAUNCHER 1
adb install ustad.apk
cd bundles
adb shell mkdir /sdcard/chimple
adb push . /sdcard/chimple/
adb shell monkey -p com.toughra.ustadmobile 1
adb shell am force-stop org.chimple.cuba

echo Press any key to exit...
pause >nul
exit