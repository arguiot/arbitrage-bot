const path = require('path');
const { workerData, parentPort } = require('worker_threads');

require('ts-node').register();
try {
    const worker = require(path.resolve(__dirname, workerData.path));
    worker.default({
        ...workerData.passedOptions,
        parentPort
    });
} catch (e) {
    console.error(e);
}
