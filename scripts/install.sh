#!/bin/sh

adb install cuba.apk
adb shell pm grant org.chimple.cuba android.permission.WRITE_EXTERNAL_STORAGE
adb shell appops set --uid org.chimple.cuba MANAGE_EXTERNAL_STORAGE allow
adb shell monkey -p org.chimple.cuba -c android.intent.category.LAUNCHER 1
adb install ustad.apk
adb shell mkdir /sdcard/chimple
adb push bundles/* /sdcard/chimple/
adb shell monkey -p com.toughra.ustadmobile 1
adb shell am force-stop org.chimple.cuba