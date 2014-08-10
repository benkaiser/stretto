# This script is temporarily to patch the send module of express
# and is only needed until express.io merge express 4.x and socket.io 1.x
# The main fix is for songs with ".." in their filenames
cd node_modules/express.io/node_modules/express
sed -r --in-place 's/send\"\: \"0\.1\.4/send\"\: \"0\.3\.0/g;' package.json
npm update
echo "If send version above is > 0.1.4, update was successful";
