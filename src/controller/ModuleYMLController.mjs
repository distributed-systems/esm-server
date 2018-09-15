import ModuleController from '../lib/ModuleController.mjs';
import ESMError from '../ESMError.mjs'


export default class ModuleYMLController extends ModuleController {


    constructor() {
        super('module-yml');

        this.enableAction('list');
    }




    async list(request) {
        await this.validateModuleHeader(request);

        // get the file 
        const yml = this.moduleManager.get(request.getHeader('module'));


        // check what the users wants
        if (request.hasHeader('key')) {
            const key = request.getHeader('key');
            
            if (!yml.hasValue(key)) {
                throw new ESMError(`The module '${yml.getIdentifier()}' at '${yml.getProjectPath()}' has no value for the key ${key}!`)
                    .status(404)
                    .code('key-not-found');
            }

            return {
                value: yml.getValue(key)
            };
        } else {
            return yml.getData();
        }
    }
}
