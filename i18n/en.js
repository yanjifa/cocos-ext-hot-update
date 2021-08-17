module.exports = {
    description: 'Generate HotUpdate Files For Native Build',
    title: 'HotUpdate',
    builder: {
        hotupdate_enable: 'Generate HotUpdate Files',
        remote_address: 'Remote Address',
        build_num: 'Build Num',
        build_num_desc: 'From CI/CD tool, Like Jenkins',
        hotupdate_version: 'HotUpdate Version',
        hotupdate_version_desc: 'Max 3 ',
        hotupdate_version_verify_msg: 'Version is Valid',
        hotupdate_storage: 'Hotupdate Storage',
        hotupdate_storage_desc: 'Hotupdate Storage Dir Name',
        hotupdate_storage_verify_msg: 'Hotupdate Storage is Valid',
    },
};
