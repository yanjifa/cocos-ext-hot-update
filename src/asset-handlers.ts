import { AssetHandlers } from '../@types';

export const compressTextures: AssetHandlers.compressTextures = async (tasks) => {
    console.log("************ compressTextures ***********");
    for (const task of tasks) {
        console.log(JSON.stringify(task));
    }
};
