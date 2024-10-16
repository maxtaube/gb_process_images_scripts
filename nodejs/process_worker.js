// process_worker.js
const { parentPort, workerData } = require('worker_threads');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Destructure workerData for easier access
const { filePath, outputDir, processedDir, rawTherapeeCLI, preset } = workerData;

console.log(`Worker started for: ${filePath}`);

const command = rawTherapeeCLI;
const args = ['-Y', '-o', outputDir, '-p', preset, '-c', filePath.replace(/\\/g, '/')];

const process = spawn(command, args, { shell: true });

process.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

process.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

process.on('close', (code) => {
    if (code === 0) {
        const destinationPath = path.join(processedDir, path.basename(filePath));
        fs.rename(filePath, destinationPath, (err) => {
            if (err) {
                parentPort.postMessage({ error: `Error moving file ${filePath} to ${destinationPath}: ${err.message}` });
            } else {
                parentPort.postMessage({ success: `Moved file to: ${destinationPath}` });
            }
        });
    } else {
        parentPort.postMessage({ error: `Worker process exited with code ${code} for file ${filePath}` });
    }
});
