import Controller from '../Controller.mjs';
import ESMError from '../ESMError.mjs';
import ModuleYML from './ModuleYML.mjs';
import fs from 'fs';

const { promises: { stat } } = fs;



export default class ModuleController extends Controller {




    constructor(name) {
        super(name);

        this.modules = new Map();
    }



    /**
     * validate the module header for its presence and validity
     *
     * @param      {Request}  request  http2 request
     * @return     {Promise}  undefined
     */
    async validateModuleHeader(request) {
        if (!request.hasHeader('module')) {
            throw new ESMError(`Missing the 'module' http header field`)
                .code('bad-request')
                .status(400);
        } else {
            const modulePath = request.getHeader('module');


            // check if the directory exists
            const stats = await stat(modulePath).catch((err) => {
                if (err.code === 'ENOENT') {
                    throw new ESMError(`The module path '${modulePath}' does not exist!`)
                        .status(404)
                        .code('module-not-found');
                } else {
                    throw err;
                }
            });


            if (!stats.isDirectory()) {
                throw new ESMError(`The module path '${modulePath}' is not a directory!`)
                    .status(500)
                    .code('module-not-a-directory');
            }



            // try to load the yml file
            const yml = new ModuleYML(modulePath);
            const exists = await yml.exists();

            if (!exists) {
                throw new ESMError(`The path '${modulePath}' is not an esm module. No module.yml file found!`)
                    .status(404)
                    .code('module-not-found');
            }


            if (!this.modules.has(yml.getProjectPath())) {
                await yml.load();

                this.modules.set(yml.getProjectPath(), yml);
            }

            request.setHeader('module', yml.getProjectPath());
        }
    }
}