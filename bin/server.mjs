#!/usr/bin/env node

import os from 'os';
import path from 'path';
import { Writable } from 'stream';
import { exec } from 'child_process';



/**
 * tiny class used to redirect the outputs of the server to systems
 * logs. needs much improvement, but works for now
 */
class Logger extends Writable {

    /**
     * @param      {string}  level   log level: info, warning, emerg
     */
    constructor(level) {
        super();
        this.level = level;
    }


    /**
     * writes chunks to the logs
     *
     * @param      {buffer}    chunk     the chunk to send to the logs
     * @param      {string}    encoding  encoding
     * @param      {Function}  callback  callback
     */
    _write(chunk, encoding, callback) {
        this.logLines(chunk.toString().split(/\n/g)).then(callback).catch(callback);
    }



    /**
     * clean the lines, log them
     *
     * @param      {array}    lines   log lines
     * @return     {Promise}  undefined
     */
    async logLines(lines) {
        for (const line of lines) {
            await this.syscat(line.replace(/"/gi, `\\"`));
        }
    }



    /**
     * send log line to syscat. what a hack.
     *
     * @param      {string}   text    text to send to the log
     * @return     {Promise}  undefined
     */
    async syscat(text) {
        return new Promise((resolve, reject) => {
            exec(`echo "${text}" | systemd-cat -t esm-server -p ${this.level}`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }


    /**
     * end the stream
     *
     * @param      {Function}  callback  callback
     */
    _final(callback) {
        callback();
    }
}


// hackety hack. send the output to syscat.
const info = new Logger('info'); 
process.stdout.write = info.write.bind(info);

const warn = new Logger('warning'); 
process.stderr.write = warn.write.bind(warn);







/**
* runs the ESM server. the server itself will check if there
* is already a server running, if yes, it will terminate itself
*/

class ESMResolverServerStarter {


    constructor() {
        this.installationDir = path.join(os.homedir(), '.esm/esm-server');
        this.serverPath = path.join(this.installationDir, 'src/ESMServer.mjs');
    }





    /**
    * run the the ESM server
    */
    async execute() {
        let ServerConstructor;

        try {
            const exported  = await import(this.serverPath);
            ServerConstructor = exported.default;
        } catch (e) {
            e.message = `Failed to load the esm server: ${e.message}`;
            throw e;
        }

        const server = new ServerConstructor();
        return await server.load();
    }
}





(async () => {
    const esmServerStarter = new ESMResolverServerStarter();

    // ensure that an esm server is running
    await esmServerStarter.execute();
})().catch((err) => {
    console.error(err.message);
    process.exit(1);
});