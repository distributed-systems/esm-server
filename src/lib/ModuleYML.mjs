import { parse, stringify } from '../../es-modules/distributed-systems/esm-yaml/x/src/index.mjs';
import path from 'path';
import fs from 'fs';

const { promises: { readFile, writeFile, stat, access } } = fs;


/**
 * Loads and writes the esm.yml files in the projects root dirs
 */
export default class ModuleYML {
    

    /**
     * Constructs the object.
     *
     * @param      {string}  projectDir  the root directory of the package that contains the esm.yml
     *                                   file
     */
    constructor(projectDir) {
        this.projectDir = projectDir.endsWith('/') ? projectDir : `${projectDir}/`;
        this.esmFilePath = path.join(this.projectDir, 'module.yml');
        
        this.data = null;

        this.isLoaded = false;
        this.isBusy = false;
    }




    /**
     * returns the normalized project path
     *
     * @return     {string}  The project path.
     */
    getProjectPath() {
        return thios.projectDir;
    }



    /**
     * get the unique identifier for the module
     *
     * @return     {string}  The identifier.
     */
    getIdentifier() {
        return `${this.getOrganization()}::${this.getName()}`;
    }




    /**
     * get the package name
     *
     * @return     {string}  name or null
     */
    getName() {
        if (this.hasValue('name')) return this.getValue('name');
        else return null;
    }


    /**
     * get the package organization
     *
     * @return     {string}  organization or null
     */
    getOrganization() {
        if (this.hasValue('organization')) return this.getValue('organization');
        else return null;
    }



    /**
     * get the package version
     *
     * @return     {string}  version or null
     */
    getVersion() {
        if (this.hasValue('version')) return this.getValue('version');
        else return null;
    }



    /**
     * get the npm modules required by this package
     *
     * @return     {array}  list of modules
     */
    getNPMDependencies() {
        if (this.hasValue('npm')) return this.getValue('npm');
        else return [];
    }



    /**
     * gets a command
     *
     * @param      {string}       name    command name
     * @return     {null|string}  the command or null if it doesn't exist
     */
    getCommand(name) {
        if (this.hasCommand(`commands.${name}`)) return this.getValue(`commands.${name}`);
        else return null;
    }



    /**
     * Determines if a specific command is defined
     *
     * @param      {string}   name    command name
     * @return     {boolean}  tur eif the command exists
     */
    hasCommand(name) {
        return this.hasValue(`commands.${name}`);
    }






    /**
     * determines if a given key exists in the data
     *
     * @param      {string}   key     he path to get the value for
     * @return     {boolean}  True if has value, False otherwise.
     */
    hasValue(key) {
        try {
            const value = this.getValue(key);
            return value !== undefined;
        } catch (err) {
            return false;
        }
    }



    /**
     * get a value from the the module.yml file
     *
     * @param      {string}  key     the path to get the value for
     * @return     {*}       The value.
     */
    getValue(key) {
        if (!this.isLoaded) throw new Error(`Cannot get value '${key}' from '${this.esmFilePath}', the file was not loaded!`);
        
        const pathParts = this.getPathParts(key);
        let currentData = this.data;
        let lastKey = '[root]';
        
        for (const index = 0; index < pathParts.length; index++) {
            const currentKey = pathParts[index];

            if (Array.isArray(currentData)) {
                if (/[^0-9]/gi.test(currentKey)) {
                    throw new Error(`Cannot get value '${key}' from '${this.esmFilePath}', the key '${currentKey}' is not a valid key for the array '${lastKey}'. Please use a numeric index for accessing arrays!`);
                }

                const arrayIndex = parseInt(currentKey, 10);
                if (arrayIndex >= currentData.length) {
                    throw new Error(`Cannot get value '${key}' from '${this.esmFilePath}', the index '${arrayIndex}' is not a valid index for the array '${lastKey}' with the length of ${currentData.length}!`);
                }

                currentData = currentData[arrayIndex];
            } else if (typeof currentData === 'object' && currentData !== null) {
                if (typeof currentData[currentKey] === 'undefined') {
                    throw new Error(`Cannot get value '${key}' from '${this.esmFilePath}', the value for '${currentKey}' on the value ${lastKey} is 'undefined'!`);
                }

                currentData = currentData[currentKey];
            } else {
                throw new Error(`Cannot get value '${key}' from '${this.esmFilePath}', the value '${lastKey}' is neither an array or an object and cannot be accessed using the key '${currentKey}'!`);
            }

            lastKey = currentKey;
        }

        return currentData;
    }




    /**
     * set a value
     *
     * @param      {sting}  key     The key
     * @param      {*}      value   The value
     */
    setValue(key, value) {
        const pathParts = this.getPathParts(key);
        let currentData = this.data;
        let parentKey = '[root]';
        
        for (const index = 0; index < pathParts.length; index++) {
            const currentKey = pathParts[index];
            const nextKey = index < pathParts.length ? pathParts[index+1] : null;

            currentData = this.setItemValue(currentData, parentKey, currentKey, nextKey, (index+1 === pathParts.length ? value : undefined));
            parentKey = currentKey;
        }

        return this;
    }



    /**
     * Sets the item value.
     *
     * @param      {Array}   data        current data object
     * @param      {string}  parentKey   The parent key
     * @param      {string}  currentKey  The current key
     * @param      {string}  nextKey     The next key
     * @param      {*}       value       The value
     * @return     {*}       current data object
     */
    setItemValue(data, parentKey, currentKey, nextKey, value) {
        if (value === undefined) {
            if (nextKey === 'x') {
                value = [];
            } else {
                value = {};
            }
        }


        if (Array.isArray(data)) {
            if (currentKey === 'x') {
                data.push(value);
            } else {
                if (/[^0-9]/gi.test(currentKey)) {
                    throw new Error(`Cannot set value for '${this.esmFilePath}', the key '${currentKey}' is not a valid key for the array '${parentKey}'. Please use a numeric index or x for accessing arrays!`);
                }

                const arrayIndex = parseInt(currentKey, 10);
                if (arrayIndex >= data.length) {
                    throw new Error(`Cannot set value for '${this.esmFilePath}', the index '${arrayIndex}' is not a valid index for the array '${parentKey}' with the length of ${data.length}!`);
                }

                data[arrayIndex] = value;
            }

            return value;
        } else if (typeof data === 'object' && data !== null) {
            data[currentKey] = value;
        } else {
            throw new Error(`Cannot set value for '${this.esmFilePath}', the value for '${parentKey}' is neither an array or an object and cannot be accessed using the key '${currentKey}'!`);
        }

        
        return value;
    }




    /**
     * Gets the path parts.
     *
     * @private
     *
     * @param      {string}  path    The path
     * @return     {array}   The path parts.
     */
    getPathParts(path) {
        return path.split('.');
    }





    /**
     * load or create the module.yml file
     *
     * @return     {Promise}  this
     */
    async loadOrCreate() {
        const exists = await this.exists();

        if (exists) {
            await this.load();
        } else {
            this.initialize();
        }
    }





    /**
     * create a boilerplate module.yml file
     */
    initialize() {
        this.data = {
            name: '<my-module>',
            organization: '<my-organization>',
            version: '1.0.0',
        };
    }






    /**
     * check if the module.yml file exists and is writable
     *
     * @return     {Promise}  true if it exists and is writable
     */
    async exists() {
        if (this.isBusy) throw new Error(`Cannot check if the '${this.esmFilePath}' exists, the file is busy!`);
        this.isBusy = true;

        let stats;


        try {
            stats = await stat(this.esmFilePath);
        } catch (err) {
            if (err.code === 'ENOENT') {
                this.isBusy = false;
                return false;
            } else {
                this.isBusy = false;
                throw err;
            }
        }


        if (stats.isFile()) {
            try {
                await access(this.esmFilePath, fs.constants.F_OK | fs.constants.W_OK);
            } catch (err) {
                if (err.code === 'ENOENT') {
                    this.isBusy = false;
                    return false;
                } else {
                    this.isBusy = false;
                    throw new Error(`The file '${this.esmFilePath}' is not writable!`);
                }
            }
        } else {
            this.isBusy = false;
            throw new Error(`The file '${this.esmFilePath}' is not a regular file!`);
        }


        this.isBusy = false;
        return true;
    }





    /**
     * loads the module.yml file, parses it
     *
     * @return     {Promise}  this
     */
    async load() {
        if (this.isBusy) throw new Error(`Cannot load '${this.esmFilePath}', the file is busy!`);
        if (this.isLoaded) throw new Error(`Cannot load '${this.esmFilePath}', the file was already loaded!`);
        this.isBusy = true;


        let blob;

        try {
            blob = await readFile(this.esmFilePath);
        } catch(err) {
            throw new Error(`Failed to load '${this.esmFilePath}': ${err.message}`);
        }


        try {
            this.data = parse(blob);
        } catch(err) {
            throw new Error(`Failed to parse '${this.esmFilePath}': ${err.message}`);
        }

        this.isBusy = false;
        this.isLoaded = true;
    }




    /**
     * save the module.yml file
     *
     * @return     {Promise}  this
     */
    async save() {
        if (this.isBusy) throw new Error(`Cannot save '${this.esmFilePath}', the file is busy!`);
        if (this.isLoaded) throw new Error(`Cannot save '${this.esmFilePath}', the file was already saved!`);
        this.isBusy = true;
        let blob;

        try {
            blob = stringify(this.data);
        } catch(err) {
            throw new Error(`Failed to stringify '${this.esmFilePath}': ${err.message}`);
        }

        try {
            await writeFile(this.esmFilePath, blob);
        } catch(err) {
            throw new Error(`Failed to save '${this.esmFilePath}': ${err.message}`);
        }

        this.data = null;
        this.isBusy = false;
        this.isLoaded = false;
    }
}
