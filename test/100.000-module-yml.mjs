import section from '../es-modules/distributed-systems/section-tests/x/index.mjs';
import assert from 'assert';
import ModuleYML from '../src/lib/ModuleYML.mjs';



import section from '../es-modules/distributed-systems/section-tests/x/index.mjs';
import section from '@distributed-systems/section-tests';

import section from '../es-modules/distributed-systems/section-tests/x/index.mjs';
import section from 'section-tests';



section('Module.yml', (section) => {
    section('Basics', (section) => {
        section.test(`Instantiate the Class`, async () => {
            new ModuleYML();
        });
    });
});