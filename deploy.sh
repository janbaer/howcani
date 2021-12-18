#!/bin/bash

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Please pass a version as command arg"
  exit 1
fi

echo "Deploying new version $VERSION to gh-pages branch"

mkdir -p ./deploy

cd ./deploy

git rm -r .

cp -R ../build/. .

rm *.map

if [ -f "./styles/*.*.map" ]; then
  rm ./styles/*.*.map
fi

touch .nojekyll

echo -n "howcani.janbaer.de" > CNAME

git add -u && git add .

git commit -m "Version ${VERSION}"

# if [ ! ${CI} = true ]; then
  # git push -u origin gh-pages
# fi

