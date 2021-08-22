# 热更新插件
## 功能介绍
- 官方热更方案融合到 Creator 构建流程中.
- 插件支持平台: Windows & MacOS.
- 构建热更支持的平台: iOS & android & windows & mac
- 构建后自动拷贝资源文件, 生成 version.manifest、project.manifest 文件.
- 自动在构建后的 main.js 中注入添加搜索目录代码.
- 支持命令行构建, 进而可支持 Jenkins 等 CI 工具.


## 测试 Demo
- 测试 Demo, 基于官方热更 Demo 修改

    Android 测试包, 使用 Creator 3.3.0 社区版构建, 热更重启时会 Crash, 不影响测试热更.

    [https://cocos.alphayan.cn/apk/tutorial-hot-update-debug.apk](https://cocos.alphayan.cn/apk/tutorial-hot-update-debug.apk)

    测试工程, 上面测试包项目地址.

    [https://github.com/yanjifa/tutorial-hot-update](https://github.com/yanjifa/tutorial-hot-update)

## 使用教程

- 手动构建:
    * [菜单->项目->构建发布->选择支持的发布平台] 会看到如下图的设置界面.
    * 勾选生成热更数据选框.
    * 资源服务地址对应 CDN 的域名等.
    * 设置 [热更存储名], 热更文件存储目录, 会自动加入到 searchPath.

        ![builder_setting](images/builder_setting.png)


- 命令行构建:
    * 配置格式和说明
    ```json
    // 命令行构建, packages 对应配置, 对应选项不传则使用默认配置
    {
        "hot-update": {
            // 是否构建热更数据
            "hotUpdateEnable": true,
            // 热更服务地址, CDN 地址...
            "remoteAddress": "http://192.168.123.108/",
            // 热更文件存储目录, 会自动加入到 searchPath,
            "storagePath": "hotupdate_storage",
            // 版本号
            "version": "1.0.0",
            // jenkins buildNum | 或其他构建工具
            "buildNum": 1
        }
    }
    ```
    * 构建命令示例
    ```bash
    # 构建参数 packages=JSON.stringify(`{"hot-update": {"hotUpdateEnable": true, ...}}`)
    /Applications/CocosCreator/Creator/3.3.0/CocosCreator.app/Contents/MacOS/CocosCreator --project /Volumes/WorkSpace/tutorial-hot-update --build "platform=android;packages={\"hot-update\":{\"hotUpdateEnable\":true,\"remoteAddress\":\"http://192.168.123.108/\",\"version\":\"1.0.0\",\"buildNum\":3}}"
    ```
- 注意事项:
    - 创建 AssetsManager 不传比较函数的话, 热更新版本号不要填写超过 3 位数字, 因为插件会把 buildNum 拼到最后一位, C++ 中的默认比较函数只取 版本号的前 4 个数字进行比较.

## 构建结果
- 构建后在项目目录下自动生成热更新文件, 目录结构如下：

    ```js
    .
    ├── hotupdate-assets                // 热更新文件根目录, 插件创建
    │   └── android                     // 对应构建平台, 上传 CDN 需从此目录开始上传
    │       ├── 1.0.0.1                 // 版本号 + buildNum
    │       │   ├── assets
    │       │   ├── jsb-adapter
    │       │   ├── project.manifest
    │       │   └── src
    │       ├── 1.0.0.3
    │       │   ├── assets
    │       │   ├── jsb-adapter
    │       │   ├── project.manifest
    │       │   └── src
    │       ├── project.manifest       // 每次都会被替换为最新一次构建结果
    │       └── version.manifest       // 每次都会被替换为最新一次构建结果
    ├── package.json
    └── tsconfig.json
    ```
- project.manifest 构建结果示例
    ```json
    {
        // 实际下载资源的 url 为: packageUrl + assets[key]
        // 例如 http://192.168.123.108/android/1.0.0.3/src/application.js
        "packageUrl": "http://192.168.123.108/android/1.0.0.3",
        "version": "1.0.0.3",
        "searchPaths": [
            "hotupdate_storage"
        ],
        "remoteManifestUrl": "http://192.168.123.108/android/project.manifest",
        "remoteVersionUrl": "http://192.168.123.108/android/version.manifest",
        "assets": {
            "src/application.js": {
                "size": 5738,
                "md5": "aaf093a660c5fa8e6559e264a0eaeed3"
            },
            "其余资源文件省略": {}
        }
    }
    ```
- main.js 脚本注入热更相关代码，添加搜索路径, 主要逻辑参考官方热更 Demo
    ```js
    // inject by extensions hot-update ---- start ----
    jsb.fileUtils.addSearchPath(jsb.fileUtils.getWritablePath() + "hotupdate_storage", true);
    var fileList = [];
    var storagePath = "hotupdate_storage";
    var tempPath = storagePath + "_temp/";
    var baseOffset = tempPath.length;

    if (jsb.fileUtils.isDirectoryExist(tempPath) && !jsb.fileUtils.isFileExist(tempPath + 'project.manifest.temp')) {
        jsb.fileUtils.listFilesRecursively(tempPath, fileList);
        fileList.forEach(srcPath => {
            var relativePath = srcPath.substr(baseOffset);
            var dstPath = storagePath + relativePath;
            if (srcPath[srcPath.length - 1] === "/") {
                jsb.fileUtils.createDirectory(dstPath)
            } else {
                if (jsb.fileUtils.isFileExist(dstPath)) {
                    jsb.fileUtils.removeFile(dstPath)
                }
                jsb.fileUtils.renameFile(srcPath, dstPath);
            }
        })
        jsb.fileUtils.removeDirectory(tempPath);
    }
    // inject by extensions hot-update ---- end ----

    // SystemJS support.
    window.self = window;
    require("src/system.bundle.js");

    const importMapJson = jsb.fileUtils.getStringFromFile("src/import-map.json");
    const importMap = JSON.parse(importMapJson);
    System.warmup({
        importMap,
        importMapUrl: 'src/import-map.json',
        defaultHandler: (urlNoSchema) => {
            require(urlNoSchema.startsWith('/') ? urlNoSchema.substr(1) : urlNoSchema);
        },
    });

    System.import('./src/application.js').then(({ createApplication }) => {
        return createApplication({
            loadJsListFile: (url) => require(url),
        });
    }).then((application) => {
        return application.import('cc').then((cc) => {
            require('jsb-adapter/jsb-engine.js');
            cc.macro.CLEANUP_IMAGE_CACHE = false;
        }).then(() => {
            return application.start({
                settings: window._CCSettings,
                findCanvas: () => {
                    var container = document.createElement('div');
                    var frame = document.documentElement;
                    var canvas = window.__canvas;
                    return { frame, canvas, container };
                },
            });
        });
    }).catch((err) => {
        console.error(err.toString());
    });
    ```
