#!/bin/sh

adb install cuba.apk
adb shell monkey -p org.chimple.cuba -c android.intent.category.LAUNCHER 1
adb install ustad.apk
adb push bundles/* /sdcard/Android/data/org.chimple.cuba/files/
adb shell monkey -p com.toughra.ustadmobile 1
adb shell am force-stop org.chimple.cuba