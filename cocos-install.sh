#!/bin/bash

# 编译
tsc
# 删除
rm -rf "$HOME"/.CocosCreator/extensions/hot-update
# 创建目录
mkdir "$HOME"/.CocosCreator/extensions/hot-update
# 拷贝
cp -a ./package.json "$HOME"/.CocosCreator/extensions/hot-update
cp -a ./dist "$HOME"/.CocosCreator/extensions/hot-update
cp -a ./images "$HOME"/.CocosCreator/extensions/hot-update
cp -a ./README.md "$HOME"/.CocosCreator/extensions/hot-update
cp -a ./i18n "$HOME"/.CocosCreator/extensions/hot-update
echo "Install Extension HotUpdate To CocosCreator Done"
