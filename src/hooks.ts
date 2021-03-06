import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { IBuildResult, IBuildTaskOption } from '../@types';
import { log, PACKAGE_NAME } from './browser';

interface IFileStat {
    filePath: string;
    size: number;
}
interface IAsset {
    size: number;
    md5: string;
    compressed?: boolean
}
interface IAssets {
    [key: string]: IAsset;
}
interface IManifest {
    packageUrl: string;
    remoteManifestUrl: string;
    remoteVersionUrl: string;
    version: string;
    assets?: IAssets,
    searchPaths?: string[],
}
interface IPluginOptions {
    hotUpdateEnable: boolean;
    remoteAddress: string;
    storagePath: string;
    version: string;
    buildNum: number;
}

export async function load() {
    // log('Load in builder.');
    // allAssets = await Editor.Message.request('asset-db', 'query-assets');
}

export function unload() {
    // log('Unload in builder.');
}

export async function onBeforeBuild(options: IBuildTaskOption) {
    //
}

export async function onBeforeBuildAssets(options: IBuildTaskOption, result: IBuildResult) {
    //
}

export async function onAfterBuildAssets(options: IBuildTaskOption, result: IBuildResult) {
    generateEmptManifest(options, result);
}

export async function onBeforeCompressSettings(options: IBuildTaskOption, result: IBuildResult) {
    //
}

export async function onAfterCompressSettings(options: IBuildTaskOption, result: IBuildResult) {
    //
}

export async function onAfterBuild(options: IBuildTaskOption, result: IBuildResult) {
    injectMainScript(options, result);
    generateManifest(options, result);
}

export async function onBeforeMake(options: IBuildTaskOption, result: IBuildResult) {
    //
}

export async function onAfterMake(options: IBuildTaskOption, result: IBuildResult) {
    //
}

/**
 * 注入脚本
 * @param options
 */
function injectMainScript(options: IBuildTaskOption, result: IBuildResult) {
    const packageOptions: IPluginOptions = options.packages?.[PACKAGE_NAME];
    if (!packageOptions.hotUpdateEnable) {
        return;
    }
    const mainScriptPath = path.resolve(`${result.paths.dir}/main.js`);
    let mainScript = fs.readFileSync(mainScriptPath).toString('utf-8');

    mainScript =
`// inject by extensions ${PACKAGE_NAME} ---- start ----
jsb.fileUtils.addSearchPath(jsb.fileUtils.getWritablePath() + "${packageOptions.storagePath}", true);
var fileList = [];
var storagePath = "${packageOptions.storagePath}";
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
// inject by extensions ${PACKAGE_NAME} ---- end ----` + mainScript;

    fs.writeFileSync(mainScriptPath, mainScript);
    log('inject main script success');
}


/**
 * 先生成 project.manifest, 存到 assets 目录下, 后面再替换, 主要不确定这时生成热更配置, 是不是最终的
 * 解决 ios | mac, cmake 生成的工程文件资源里缺少这两个文件
 *
 * @param options
 */
function generateEmptManifest(options: IBuildTaskOption, result: IBuildResult) {
    const packageOptions: IPluginOptions = options.packages?.[PACKAGE_NAME];
    if (!packageOptions.hotUpdateEnable) {
        return;
    }
    const assetsRootPath = result.paths.dir;
    const projectManifestName = 'project.manifest';
    const destManifestPath = path.join(assetsRootPath, projectManifestName);
    fs.writeFileSync(destManifestPath, JSON.stringify({}));
    log('generateEmptManifest success');
}

/**
 * 生成热更文件
 * @param options
 */
function generateManifest(options: IBuildTaskOption, result: IBuildResult) {
    const packageOptions: IPluginOptions = options.packages?.[PACKAGE_NAME];
    if (!packageOptions.hotUpdateEnable) {
        return;
    }
    let remoteUrl = packageOptions.remoteAddress;
    if (remoteUrl.endsWith('/')) {
        remoteUrl = remoteUrl.slice(0, -1);
    }
    // build num | from 1 to max
    const buildNum = !isNaN(Number(packageOptions.buildNum)) ? Number(packageOptions.buildNum) : 1;
    const hotupdateVersion = `${packageOptions.version.trim()}.${buildNum.toFixed()}`;
    const projectPath = Editor.Project.path;
    const assetsRootPath = result.paths.dir;
    //
    const projectManifestName = 'project.manifest';
    const versionManifestName = 'version.manifest';
    //
    let destManifestPath = path.join(assetsRootPath, projectManifestName);
    // 前面那步用完了, 这里先删掉, 生成 project.manifest 不希望有这个文件的记录
    fs.unlinkSync(destManifestPath);
    // 构建后默认资源目录
    const assetsPaths = ['src', 'assets', 'jsb-adapter'];
    // 初始化 manifest
    const packageUrl = `${remoteUrl}/${options.platform}/${hotupdateVersion}`;
    const manifest: IManifest = {
        packageUrl: encodeURI(packageUrl),
        version: hotupdateVersion,
        searchPaths: [packageOptions.storagePath],
        remoteManifestUrl: encodeURI(`${remoteUrl}/${options.platform}/${projectManifestName}`),
        remoteVersionUrl: encodeURI(`${remoteUrl}/${options.platform}/${versionManifestName}`),
        assets: {},
    };
    // 获取目录内所有文件
    const listDir = (assetPath: string) => {
        const fileList: IFileStat[] = [];
        const stat = fs.statSync(assetPath);
        if (stat.isDirectory()) {
            const subpaths = fs.readdirSync(assetPath);
            for (let i = 0; i < subpaths.length; i++) {
                let subpath = subpaths[i];
                if (subpath[0] === '.') {
                    continue;
                }
                subpath = path.join(assetPath, subpath);
                fileList.push(...listDir(subpath));
            }
        } else if (stat.isFile()) {
            fileList.push({
                filePath: assetPath,
                size: stat.size,
            });
        }
        return fileList;
    };
    // 创建目录
    const mkdirSync = (dirName: string) => {
        try {
            fs.mkdirSync(dirName);
        } catch (e: any) {
            if (e.code !== 'EEXIST') throw e;
        }
    };
    // 递归删除目录及文件
    const deleteDirSync = (dirName: string) => {
        let files = [];
        if (fs.existsSync(dirName)) {
            // 返回文件和子目录的数组
            files = fs.readdirSync(dirName);
            files.forEach((file) => {
                const curPath = path.join(dirName, file);
                // fs.statSync同步读取文件夹文件，如果是文件夹，在重复触发函数
                if (fs.statSync(curPath).isDirectory()) {
                    deleteDirSync(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            // 清除文件夹
            fs.rmdirSync(dirName);
        }
    }
    // Iterate assets and src folder
    const assetsList: IFileStat[] = [];
    assetsPaths.forEach((o) => {
        assetsList.push(...listDir(path.join(assetsRootPath, o)));
    });
    // 填充 manifest.assets 对象
    let md5: string, compressed: boolean, assetUrl: string;
    const assetsObj: IAssets = {};
    assetsList.forEach((assetStat) => {
        md5 = crypto.createHash('md5').update(fs.readFileSync(assetStat.filePath)).digest('hex');
        compressed = path.extname(assetStat.filePath).toLowerCase() === '.zip';
        assetUrl = path.relative(assetsRootPath, assetStat.filePath);
        assetUrl = assetUrl.replace(/\\/g, '/');
        assetUrl = encodeURI(assetUrl);
        assetsObj[assetUrl] = {
            size: assetStat.size,
            md5: md5,
        };
        if (compressed) {
            assetsObj[assetUrl].compressed = true;
        }
    });
    manifest.assets = assetsObj;
    // 热更构建结果存储目录
    let hotupdateAssetsPath = path.join(projectPath, 'hotupdate-assets');
    mkdirSync(hotupdateAssetsPath);
    const manifestPath = path.join(hotupdateAssetsPath, options.platform);
    mkdirSync(manifestPath);
    hotupdateAssetsPath = path.join(manifestPath, hotupdateVersion);
    mkdirSync(hotupdateAssetsPath);
    // 如果目录不为空, 先清除
    deleteDirSync(hotupdateAssetsPath);
    // 保存 project.manifest 到磁盘
    fs.writeFileSync(destManifestPath, JSON.stringify(manifest));
    destManifestPath = path.join(manifestPath, projectManifestName);
    fs.writeFileSync(destManifestPath, JSON.stringify(manifest));
    log('Manifest successfully generated');

    delete manifest.assets;
    delete manifest.searchPaths;

    // 保存 version.manifest 到磁盘
    const destVersionPath = path.join(manifestPath, versionManifestName);
    fs.writeFileSync(destVersionPath, JSON.stringify(manifest));
    log('Version successfully generated');
    // 拷贝构建后的热更资源
    assetsPaths.push(projectManifestName);
    assetsPaths.forEach((assetPath) => {
        const destPath = path.join(hotupdateAssetsPath, assetPath);
        assetPath = path.join(assetsRootPath, assetPath);
        // 拷贝
        Build.Utils.copyDirSync(assetPath, destPath);
    });
    log('copy assets success');
}
