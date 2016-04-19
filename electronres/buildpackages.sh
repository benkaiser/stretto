#!/bin/bash
# first run electron-packager and put the output in tmp
echo 'Building Stretto for all platforms'
electron-packager ./ "Stretto" --platform=win32,linux,darwin --arch=all --version=0.37.6 --out=/tmp --overwrite --ignore="dbs|bower_components|electronres" --icon electronres/icon --prune

# then copy the ffmpeg binaries into them
echo 'Copying ffmpeg binaries to windows builds'
cp electronres/ffmpeg32.exe /tmp/Stretto-win32-ia32/resources/app/ffmpeg.exe
cp electronres/ffmpeg64.exe /tmp/Stretto-win32-x64/resources/app/ffmpeg.exe

# zip the resulting Stretto folders
echo 'Zipping packages for uploading'
cd /tmp
for d in Stretto-*/; do target=${d%/}; echo "Zipping $target"; zip -qry9 "$target.zip"  $d; done;
