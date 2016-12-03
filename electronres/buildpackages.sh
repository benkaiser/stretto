#!/bin/bash
# first run electron-packager and put the output in tmp
echo 'Building Stretto for all platforms'
electron-packager ./ "Stretto" --platform=win32,linux,darwin --arch=all --version=1.4.10 --out=/tmp --overwrite --ignore="dbs|bower_components|electronres" --icon electronres/icon --prune

# zip the resulting Stretto folders
echo 'Zipping packages for uploading'
cd /tmp
for d in Stretto-*/; do target=${d%/}; echo "Zipping $target"; zip -qry9 "$target.zip"  $d; done;
