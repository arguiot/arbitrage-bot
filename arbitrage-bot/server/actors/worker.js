const path = require("path");
const { workerData, parentPort } = require("worker_threads");

const project = path.resolve(__dirname, "../../tsconfig.json");
require("ts-node").register({
    project,
    transpileOnly: true,
});
try {
    const worker = require(path.resolve(__dirname, workerData.path));
    worker.default({
        ...workerData.passedOptions,
        parentPort,
        memory: workerData.memory,
    });
} catch (e) {
    debugger;
    console.error(e);
}
