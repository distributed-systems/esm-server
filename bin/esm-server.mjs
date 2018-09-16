#!/usr/bin/env node

import os from 'os';
import path from 'path';
import { spawn } from 'child_process';



/**
* runs the ESM server. the server itself will check if there
* is already a server running, if yes, it will terminate itself
*/

class ESMServerStarter {


    constructor() {
        this.installationDir = path.join(os.homedir(), '.esm/esm-server');
        this.serverPath = path.join(this.installationDir, 'bin/server.mjs');
    }




    async spawnServer() {
        return new Promise((resolve, reject) => {
            const child = spawn('node', [
                '--experimental-modules',
                '--no-warnings',
                this.serverPath,
            ], {
                detached: true,
                stdio: ['ignore', 'ignore', 'ignore', 'ipc']
            });

            //child.stdout.on('data', (data) => console.log(data.toString()));
            //child.stderr.on('data', (data) => console.log(data.toString()));
            child.on('message', (data) => {
                child.unref();
                resolve();
            });
        });
    }
}





(async () => {
    const esmServerStarter = new ESMServerStarter();

    // ensure that an esm server is running
    await esmServerStarter.spawnServer();

    process.exit();
})().catch((err) => {
    console.error(err.message);
    process.exit(1);
});