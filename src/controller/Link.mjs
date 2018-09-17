import Controller from '../Controller.mjs';
import ESMError from '../ESMError.mjs'




export default class ModuleYMLController extends Controller {

    constructor() {
        super('link');

        this.enableAction('create');
    }




    async create(request) {
        const data = await request.getData();

        console.log(data);
    }
}
