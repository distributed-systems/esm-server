import fs from 'fs';
import path from 'path';


const { promises: { readdir } } = fs;




export default class Service {


    constructor({
        rootDir,
    }) {
        this.rootDir = rootDir;


        this.controllers = new Map();
        this.actionPatterns = new Map([
            ['list', {
                url: '/${resource}',
                action: 'get',
                defaultStatus: 200,
            }],
            ['listOne',  {
                url: '/${resource}/:id',
                action: 'get',
                defaultStatus: 200,
            }],
            ['create',  {
                url: '/${resource}',
                action: 'post',
                defaultStatus: 201,
            }],
            ['createOrUpdate',  {
                url: '/${resource}/:id?',
                action: 'put',
                defaultStatus: 200,
            }],
            ['update',  {
                url: '/${resource}/:id',
                action: 'patch',
                defaultStatus: 200,
            }],
            ['delete',  {
                url: '/${resource}/:id',
                action: 'delete',
                defaultStatus: 200,
            }]
        ]);
    }






    /**
    * add a controller that needs to be registered
    */
    registerController(controllerInstance) {
        const controllerName = controllerInstance.getName();

        if (!this.controllers.has(controllerName)) {
            this.controllers.set(controllerName, controllerInstance);
        } else {
            throw new Error(`Cannot register controller ${controllerName}, it was alread registered before!`);
        }
    }





    /**
    * find controllers, load them, register their routes
    */
    async load(router) {

        // searches for controllers in the controllers directory
        await this.findControllers();

        // load the controllers
        await this.loadControllers(router);
    }





    /**


    * load all mjs files from the controllers
    * directory
    */
    async findControllers() {
        const directory = path.join(this.rootDir, 'src/controller');
        const files = await readdir(directory);

        for (const fileName of files) {
            if (fileName.endsWith('.mjs')) {
                const filePath = path.join(directory, fileName);
                const exported = await import(filePath);
                const Constructor = exported.default;

                let instance;

                try {
                    instance = new Constructor();
                } catch (err) {
                    throw new Error(`Failed to load controller ${filePath}: ${err.message}`);
                }

                this.registerController(instance);
            }
        }
    }






    /**
    * load controllers
    */
    async loadControllers(router) {
        for (const controller of this.controllers.values()) {
            const controllerName = controller.getName();

            // load the controller
            await controller.load();

            // get all available actions
            const enabledActions = controller.getEnabledActionNames();


            // register the routes for all actions
            for (const actionName of enabledActions.values()) {
                if (this.actionPatterns.has(actionName)) {
                    const action = this.actionPatterns.get(actionName);

                    // get a valid express url
                    const url = this.compileURLPattern(action.url, {
                        resource: controllerName,
                    }, {
                        controllerName,
                        actionName,
                    });


                    // register on the router
                    router[action.action](url, (request) => {
                        if (typeof controller[actionName] === 'function') {

                            // call the action handler on the controller
                            controller[actionName](request).then((data) => {

                                // check if the response was already sent, if not, 
                                // send it now with the status defined by the action
                                // configuration
                                if (!request.response().isSent()) {
                                    if (typeof data === 'object' && data !== null && typeof data.toJSON === 'function') data = data.toJSON();
                                    
                                    request.response().status(action.defaultStatus).send(data);
                                }
                            }).catch((err) => {

                                // send the error to the client if the response wasn't sent yet
                                if (!request.response().isSent()) {
                                    if (err.status) {
                                        request.response().status(err._status).send({
                                            message: err.message,
                                            status: err._status,
                                            code: err._code,
                                            data: err._data,
                                            stack: err.stack.split('\n').map(line => line.trim()),
                                        }).catch(console.error);
                                    } else {
                                        request.response().status(500).send({
                                            message: err.message,
                                            status: 500,
                                            code: 'server-error',
                                            stack: err.stack.split('\n').map(line => line.trim()),
                                        }).catch(console.error);
                                    }
                                } else {
                                    console.log(`Unadnled exception:`, err);
                                }
                            });
                        } else {
                            request.response().status(500).send(`Cannot route request: the action ${actionName} does not exist on the controller ${controllerName}!`);
                            throw new Error(`Cannot route request: the action ${actionName} does not exist on the controller ${controllerName}!`);
                        }
                    });
                } else {
                    throw new Error(`The action ${actionName} for the controller ${controllerName} is not a valid action!`);
                }
            }
        }
    }






    /**
    * fill in details in action url patters
    */
    compileURLPattern(url, values, {
        controllerName,
        actionName,
    }) {
        let result;

        while(result = /\{([^\}]+)\}/gi.exec(url)) {
            const paramterName = result[1];
            if (typeof values[paramterName] !== 'undefined') {
                url = url.replace('${'+paramterName+'}', values[paramterName]);
            } else {
                throw new Error(`Route ${controllerName}::${actionName}: cannot replace parameter ${paramterName} with the corresponding value, the value was not passed to the url pattern compiler!`);
            }
        }

        return url;
    }
}