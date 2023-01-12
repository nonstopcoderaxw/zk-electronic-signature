const fs = require("fs");

async function saveObj(path, objName, obj) {
    await createFile(`${path}/${objName}.json`, JSON.stringify(obj, null, 4));
}

async function loadObj(path, objName) {
    return JSON.parse(await readFile(`${path}/${objName}.json`));
}

async function clearObj(objName) {
    await saveObj(objName, "");
}

async function createFile(fileName, body){
    await fs.promises.writeFile(fileName, body);
    return true;
}

async function readFile(fileName){
    return await fs.promises.readFile(fileName, 'utf8');
}

module.exports = {
    saveObj,
    loadObj,
    clearObj,
    createFile,
    readFile
}
