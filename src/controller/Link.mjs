import Controller from '../Controller.mjs';
import ESMError from '../ESMError.mjs'
import Link from '../lib/Link.mjs';




export default class ModuleYMLController extends Controller {

    constructor() {
        super('link');

        this.enableAction('create');
    }




    async create(request) {
        const data = await request.getData();

        const link = new Link();

        await link.link(data.linkFrom, data.linkTo);
        console.log(data);
    }
}
