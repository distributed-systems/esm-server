import Service from './Service';
import HTTP2Server from '../es-modules/distributed-systems/http2-server/x/src/HTTP2Server.mjs';
import HTTP2Client from '../es-modules/distributed-systems/http2-client/x/src/HTTP2Client.mjs';
import fs from 'fs';
import path from 'path';


const { promises: {readFile}} = fs; 



export default class ESMServer {

    constructor() {
        this.startTime = Date.now();

        this.port = 4466;
        this.host = 'localhost';

        // many components relay on the directory of this
        // project. get it from the meta object.
        this.rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../');

        // indicates for the client if the server is ready
        // since the server loads its service & routes after
        // the server came online in order to have faster 
        // startup times
        this.isLoaded = false;

        // not really of any use at the moment, but it will
        // be some day
        this.version = 1;

        // the server shuts down after x seconds since we're 
        // not going to run a server all day that isn't of
        // any use to the user. esm will start it as it as
        // it is of use ot it
        this.lastHit = Date.now();
        this.idleTimeout = 10*1000;

        // kill the server after the idle time was hit
        this.idleInterval = setInterval(() => {
            if (this.lastHit + this.idleTimeout < Date.now()) {
                console.log(`The server is shutting down becuase it's idle`);
                this.end().catch(console.log);
            }
        }, Math.round(this.idleTimeout/4));
    }





    /**
    * shuts the server down
    */
    async end() {
        if (this.idleInterval) clearInterval(this.idleInterval);
        if (this.server) await this.server.close();
    }






    async load() {
        this.key = await readFile(path.join(this.rootDir, 'certificate/localhost-privatekey.pem'));
        this.certificate = await readFile(path.join(this.rootDir, 'certificate/localhost-certificate.pem'));

        await this.listen();
    }






    /**
    * try to call the server in order to validate its identity
    * yup. not secure at all. Lets it also know that is a to 
    * stay alive
    */
    async probeServer() {
        const client = new HTTP2Client();
        const response = await client
            .get(`https://localhost:${this.port}/esm-status`)
            .expect(200)
            .ca(this.certificate)
            .send();

        const data = await response.getData();

        if (data) {
            if (!data.loaded) {
                await this.probeServer();
            }
        }
     }








    /**
    * start the web server, if the port is in use, try to connect
    * to it and check if we're talking with another instance of 
    * this server.
    */
    async listen() {
        this.server = new HTTP2Server({
            key: this.key,
            certificate: this.certificate,
            host: this.host,
        });



        // start answering on the status route immediately
        const router = this.server.getRouter();
        router.get('/esm-status', (request) => {
            request.response()
                .status(200)
                .send({
                    server: 'esm',
                    loaded: this.isLoaded,
                    version: this.version,
                });
        });


        // keep the server alive as long requests are coming in
        this.server.on('request-notification', () => {
            this.lastHit = Date.now();
        });


        await this.server.load();
        await this.server.listen(this.port).catch(async (err) => {
            if (err.code === 'EADDRINUSE') {
                // the server is probable running already, 
                // validate that assumption
                
                await this.probeServer();

                console.log(`server already running`);
                process.exit();
            } else {

                // let the user know about this
                throw err;
            }
        });


        // load controllers, register routes
        await this.setupService(router).then(() => {
            this.isLoaded = true;
            console.log(`The server was loaded in ${Date.now()-this.startTime} milliseconds`);
        });
    }






    /**
    * register all routes that the controllers provide
    */
    async setupService(router) {
        this.service = new Service({
            rootDir: this.rootDir,
        });


        await this.service.load(router);
    }
}