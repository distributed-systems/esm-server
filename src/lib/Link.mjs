import ESMError from '../ESMError.mjs';
import ModuleYML from './ModuleYML.mjs';



export default class Link {


    contructor() {

    }




    /**
    * creates as symlink from the source to the targets es-modules dir
    */
    async link(from, to) {
        if (from === to) {
            throw new ESMError(`Cannot link from ${from} to ${to}: paths are identical!`)
                .status(409)
                .code('link-identical-paths');
        }

        const targetYML = new ModuleYML(from);

        if (!await targetYML.exists()) {
            throw new ESMError(`The path '${from}' is not a esm module. No module.yml file found!`)
                .status(404)
                .code('module-not-found');
        }


    }
}