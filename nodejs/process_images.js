const cluster = require('cluster');
const os = require('os');
const chokidar = require('chokidar');
const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs');

// Configuration
const watchDir = 'C:\\Users\\Max\\Desktop\\folder';
const outputDir = 'C:\\Users\\Max\\Desktop\\output';
const processedDir = 'C:\\Users\\Max\\Desktop\\processed_raws';
const preset = 'C:\\Users\\Max\\Desktop\\profile.pp3';
const rawTherapeeCLI = '"C:\\Program Files\\RawTherapee\\5.11\\rawtherapee-cli.exe"';

// Ensure the processed directory exists
if (!fs.existsSync(processedDir)) {
    fs.mkdirSync(processedDir);
}

if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    console.log(`Master process is running with PID ${process.pid}`);
    console.log(`Starting ${numCPUs} worker processes...`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Handle exit of worker processes
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} exited with code ${code}`);
        // Restart the worker if it dies
        cluster.fork();
    });
} else {
    console.log(`Worker ${process.pid} started...`);

    // Queue for files to be processed
    const fileQueue = [];

    // Function to spawn a worker thread for processing each file
    function processFile(filePath) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, 'process_worker.js'), {
                workerData: {
                    filePath,
                    outputDir,
                    processedDir,
                    rawTherapeeCLI,
                    preset
                }
            });

            worker.on('message', (message) => {
                if (message.error) {
                    console.error(message.error);
                    reject(new Error(message.error));
                } else {
                    console.log(message.success);
                    resolve();
                }
            });

            worker.on('error', (error) => {
                console.error(`Worker error: ${error}`);
                reject(error);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`Worker thread exited with code ${code}`);
                    reject(new Error(`Worker thread exited with code ${code}`));
                }
                // Start processing the next file in the queue
                if (fileQueue.length > 0) {
                    processFile(fileQueue.shift());
                }
            });
        });
    }

    // Set up the watcher
    const watcher = chokidar.watch(watchDir, {
        persistent: true,
        ignoreInitial: false,
        depth: 0,
        awaitWriteFinish: {
            stabilityThreshold: 3000,
            pollInterval: 100
        }
    });

    watcher
        .on('add', (filePath) => {
            const ext = path.extname(filePath).toLowerCase();
            if (ext === '.cr3') {
                console.log(`Detected new file: ${filePath}`);
                fileQueue.push(filePath);

                // Start processing if there's an available worker
                if (fileQueue.length > 0) {
                    processFile(fileQueue.shift());
                }
            } else {
                console.log(`File is not a CR3 file. Skipping: ${filePath}`);
            }
        })
        .on('error', (error) => {
            console.error(`Watcher error: ${error}`);
        });

    console.log(`Worker ${process.pid} monitoring ${watchDir} for new .CR3 files.`);
}
