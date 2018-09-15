import Controller from '../Controller.mjs';


export default class ApplicationStatusController extends Controller {


    constructor() {
        super('application-status');
        this.enableAction('list');
        this.started = new Date();
    }





    /**
    * register a new service
    */
    async list(request) {
        return {
            status: 'ready',
            uptime: Math.round((Date.now()-this.started.getTime())/1000),
            started: this.started.toISOString(),
        };
    }
}