#!/bin/bash
# 编译
tsc
# 删除
rm -rf ./hot-update
rm -rf ./hot-update.zip
# 创建目录
mkdir ./hot-update
# 拷贝
cp -a ./package.json ./hot-update
cp -a ./dist ./hot-update
cp -a ./images ./hot-update
cp -a ./README.md ./hot-update
cp -a ./i18n ./hot-update
# 压缩
zip -r -m hot-update.zip ./hot-update
echo "pack done"
