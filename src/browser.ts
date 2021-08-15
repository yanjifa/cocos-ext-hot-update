const packageJSON = require('../package.json');
// 必须保持和 package.json 一样
export const PACKAGE_NAME = packageJSON.name;

export function log(...arg: unknown[]) {
    return console.log(`[${PACKAGE_NAME}] `, ...arg);
}

export function load() {
    // log("browser loaded!");
}

export function unload() {
    // log("browser unload!");
}

export const methods = {
    //
};
