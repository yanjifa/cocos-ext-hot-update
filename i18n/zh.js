module.exports = {
    description: '为构建原生平台项目, 生成热更新数据',
    title: '热更新',
    builder: {
        hotupdate_enable: '生成热更新数据',
        remote_address: '资源服务地址',
        build_num: 'Build Num',
        build_num_desc: 'CI/CD 工具提供, 比如 Jenkins',
        hotupdate_version: '热更新版本号',
        hotupdate_version_desc: '不要超过 3 位',
        hotupdate_version_verify_msg: '版本号有效',
        hotupdate_storage: '热更存储名',
        hotupdate_storage_desc: '热更新存储目录 & 搜索路径, 不要带斜杠',
        hotupdate_storage_verify_msg: '热更存储名有效',
    },
};
