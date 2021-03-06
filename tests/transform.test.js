/* global jest */
const ospath = require('path');
const loaderTester = require('./loader-tester');
const { specLoaderRule } = require('../index');

const loaderPath = ospath.resolve(__dirname, '../index.js');
jest.setTimeout(30000);

const createBabelConfig = (options) => {
    let baseOptions = {
        configFile: false,
        babelrc: false,
        plugins: [
            '@babel/plugin-proposal-export-default-from',
            '@babel/plugin-proposal-export-namespace-from',
            '@babel/plugin-syntax-dynamic-import',
            '@babel/plugin-syntax-import-meta'
        ],
        presets: [
            ["@babel/preset-env", { targets: { esmodules: true } }]
        ]
    };

    return Object.assign(baseOptions, options);
};

const fixtureRoot = (fixtureDir) => ospath.resolve(__dirname, fixtureDir);

const setupRules = (loaderOptions = {}) => ({babelConfig, enforce}) => {
    const use = [];

    if (babelConfig) {
        use.push({ loader: 'babel-loader', options: babelConfig });
        loaderOptions.babelConfig = babelConfig;
    }

    use.push({ loader: loaderPath, options: loaderOptions });
    
    return [specLoaderRule, { test: /\.js$/, enforce, use }];
};

const coreTests = {
    'should leave imports with no specifiers alone': {
        entry: '1 bare import.js',
        output: `import 'testmodule';`,
    },

    'should convert named imports to default equivalent': {
        entry: '2 single named import.js',
        output: `import theFirstFunc from "./testmodule/myFirstFunc.js";`,
    },

    'should convert by-name default import to default equivalent': {
        entry: '3 import default module by-name then re-export.js',
        output: `import byNameDefaultImportFunc from "./testmodule/myFirstFunc.js";`,
    },

    'should convert by-name default export-from to default equivalent': {
        entry: '4 export-from default module by-name.js',
        output: `import byNameDefaultExportFunc from "./testmodule/myFirstFunc.js";`,
    },

    'should be able to follow through multiple re-exports': {
        entry: '5 import module re-exported multiple times.js',
        output: `import { mySecondFunc as theExportedSecondFunc } from "./testmodule/mySecondFunc.js";`,
    },

    'should be able to follow through multiple aliases': {
        entry: `6 import module aliased multiple times.js`,
        output: `import { mySecondFunc as theSecondFunc } from "./testmodule/mySecondFunc.js";`,
    },

    'should be able to handle multiple named imports': {
        entry: `7 multiple named imports.js`,
        output: `
            import theFirstFunc from "./testmodule/myFirstFunc.js";
            import { mySecondFunc as theSecondFunc } from "./testmodule/mySecondFunc.js";
        `,
    },

    'should be able to handle default and multiple named imports': {
        entry: '8 default import with multiple named import.js',
        output: `
            import init from "./testmodule/index.js";
            import theFirstFunc from "./testmodule/myFirstFunc.js";
            import { mySecondFunc as theSecondFunc } from "./testmodule/mySecondFunc.js";
        `,
    },

    'should correctly handle aliased imports': {
        entry: '9 aliased named import.js',
        output: `import aliasedFunc from "./testmodule/myFirstFunc.js";`,
    },

    'should leave single default imports alone': {
        entry: `10 default import.js`,
        output: `import myFirstFunc from "testmodule/myFirstFunc";`,
    },

    'should leave single default common js imports alone': {
        entry: '11 common js default import.js',
        output: `import React from "commonjsmodule";`,
    },

    'should handle multiple common js imports': {
        entry: '12 common js default with named import.js',
        output: `
            import React from "./commonjsmodule/index.js";
            import { Component } from "./commonjsmodule/index.js";
        `,
    },

    'should be able to handle aliased namespaced re-exports': {
        entry: '13 aliased namespace import.js',
        output: `import * as thangs from "./testmodule/constants.js";`,
    },

    'should leave namespaced imports alone': {
        entry: '14 namespace import.js',
        output: `import * as testmodule from "./testmodule/index.js";`,
    },

    'should follow through export-from': {
        entry: '15 export-from in single line.js',
        output: `import theInlineFirstFunc from "./testmodule/myFirstFunc.js";`,
    },

    'should follow through export-from, even if never aliased': {
        entry: '16 export-from un-aliased.js',
        output: `import { myThirdFunc } from "./testmodule/myThirdFunc.js";`,
    },

    'should not follow past the first encountered default import, using import-from': {
        entry: '17 import nested default export.js',
        output: `import defaultFirstFunc from "./testmodule/defaultExport.js";`,
    },

    'should not follow past the first encountered default import, using export-from': {
        entry: '18 import nested default export-from.js',
        output: `import byNameDefaultNestedFunc from "./testmodule/defaultExport.js";`,
    },

    'should be able to resolve properly despite confusing naming': {
        entry: '19 confusing naming.js',
        output: `import { mySecondFunc as FOO } from "./testmodule/mySecondFunc.js";`,
    },

    'should be able to handle namespaced export-from': {
        entry: '20 import of a namespaced export.js',
        output: `import * as thungs from "./testmodule/constants.js";`,
    },

    'should be able to handle an aliased namespaced export-from': {
        entry: '21 aliased import of a namespaced export.js',
        output: `import * as myAliasedThungs from "./testmodule/constants.js";`,
    }
};

const webpackSpecificTests = {
    'should be able to handle imports with inline loaders': {
        entry: '1 inline loader.js',
        output: `import theOneTrueAnswer from "val-loader!./testmodule/valCode.js";`,
    }
};

loaderTester({
    describe: 'core functionality (async mode)',
    rules: setupRules(),
    babelConfig: createBabelConfig(),
    context: fixtureRoot('test-1'),
    tests: coreTests,
});

loaderTester({
    describe: 'core functionality (sync mode)',
    rules: setupRules({
        syncMode: true
    }),
    babelConfig: createBabelConfig(),
    context: fixtureRoot('test-1'),
    tests: coreTests,
});

loaderTester({
    describe: 'webpack-specific functionality',
    rules: setupRules({
        transformDefaultImports: true
    }),
    babelConfig: createBabelConfig(),
    context: fixtureRoot('test-2'),
    tests: webpackSpecificTests,
});

loaderTester({
    describe: 'transformation of `export-from`',
    rules: setupRules({
        transformDefaultImports: true
    }),
    babelConfig: createBabelConfig(),
    context: fixtureRoot('test-1'),
    tests: {
        // these tests are transformed by Babel,
        // which is why they look a little different

        'should be able to transform export-default-from': {
            entry: '24 export default from.js',
            output: `
                import _theFirstFunc from "./testmodule/myFirstFunc.js";
                export { _theFirstFunc as theFirstFunc };
            `,
        },

        'should be able to transform export-named-from': {
            entry: '25 export named from.js',
            output: `
                import _theFirstFunc from "./testmodule/myFirstFunc.js";
                export { _theFirstFunc as theFirstFunc };
            `,
        },

        'should be able to transform export-namespace-from': {
            entry: '26 export namespace from.js',
            output: `
                import * as _things from "./testmodule/constants.js";
                export { _things as things };
                import * as _constants from "./testmodule/constants.js";
                export { _constants as constants };
            `,
        }
    },
});

loaderTester({
    describe: 'core tests, with `unsafeAstCaching === true`',
    rules: setupRules({
        unsafeAstCaching: true
    }),
    babelConfig: createBabelConfig(),
    context: fixtureRoot('test-1'),
    tests: coreTests,
});

loaderTester({
    describe: 'webpack-specific tests, with `unsafeAstCaching === true`',
    rules: setupRules({
        unsafeAstCaching: true
    }),
    babelConfig: createBabelConfig(),
    context: fixtureRoot('test-2'),
    tests: webpackSpecificTests,
});

loaderTester({
    describe: 'with `transformDefaultImports === true`',
    rules: setupRules({
        transformDefaultImports: true
    }),
    babelConfig: createBabelConfig(),
    context: fixtureRoot('test-1'),
    tests: {
        'should follow past first encountered default import, using import-from': {
            entry: '22 transformDefaultImports - import nested default export.js',
            output: `import defaultFirstFunc from "./testmodule/myFirstFunc.js";`,
        },

        'should follow past first encountered default import, using export-from': {
            entry: `23 transformDefaultImports - import nested default export-from.js`,
            output: `import byNameDefaultNestedFunc from "./testmodule/myFirstFunc.js";`,
        },
    },
});

const sideEffectConfig = (config) => {
    config.optimization = Object.assign(config.optimization || {}, {
        providedExports: true,
        sideEffects: true
    });
    return config;
};

loaderTester({
    describe: 'with `transformSideEffects === false`',
    rules: setupRules({
        transformSideEffects: false
    }),
    webpackConfig: sideEffectConfig,
    babelConfig: createBabelConfig(),
    context: fixtureRoot('test-3'),
    tests: {
        'should stop when the local `package.json` declares side-effects': {
            entry: '1 side-effecting local import.js',
            output: `import { FOO as sideEffectFoo } from "./testmodule/sideEffects.js";`,
        },

        'should stop when a node-module\'s `package.json` declares side-effects': {
            entry: '2 side-effecting node-module import.js',
            output: `import { doTheThing } from "./node_modules/side-effecty/index.js";`,
        },

        'should transform when a node-module\'s `package.json` declares itself pure': {
            entry: '3 pure node-module import.js',
            output: `import doTheThing from "./node_modules/pure-boy/doTheThing.js";`,
        },

        'should assume side-effects when the `package.json#sideEffect` property is undefined': {
            entry: '4 unclear node-module import.js',
            output: `import { doTheThing } from "./node_modules/unclr/index.js";`,
        },

        'should be able to handle side-effecting imports with inline loaders': {
            entry: '7 side-effecting local loader import.js',
            output: `import { FOO as loadedFoo } from "val-loader!./testmodule/valCode.js";`,
        }
    },
});

loaderTester({
    describe: 'with `transformSideEffects === true`',
    rules: setupRules({
        transformSideEffects: true
    }),
    webpackConfig: sideEffectConfig,
    babelConfig: createBabelConfig(),
    // this test uses inline loaders;
    // enforcing post ensures they transform first
    enforce: 'post',
    context: fixtureRoot('test-3'),
    tests: {
        'should respect local side-effects': {
            entry: '5 ignore side-effecting local import.js',
            output: `
                import "./testmodule/sideEffects.js";
                import { FOO as sideEffectFoo } from "./testmodule/constants.js";
            `,
        },

        'should add a side-effecting import': {
            entry: '6 ignore side-effecting node-module import.js',
            output: `
                import "./node_modules/side-effecty/index.js";
                import doTheThing from "./node_modules/side-effecty/doTheThing.js";
            `,
        },

        'should be able to handle side-effecting imports with inline loaders': {
            entry: '7 side-effecting local loader import.js',
            output: `
                import "val-loader!./testmodule/valCode.js";
                import { FOO as loadedFoo } from "./testmodule/constants.js";
            `,
        },

        'should add a side-effecting import if side-effects are deeper than one level': {
            entry: '8 deep side-effect import.js',
            output: `
                import "./node_modules/side-effecty/index.js";
                import "./node_modules/side-effecty/deeper.js";
                import doTheDeepThing from "./node_modules/side-effecty/doTheThing.js";
            `,
        },
        'should combine identical side-effecting imports': {
            entry: '9 multiple side-effect import.js',
            output: `
                import "./node_modules/side-effecty/index.js";
                import "./node_modules/side-effecty/deeper.js";
                import doTheThing from "./node_modules/side-effecty/doTheThing.js";
                import doTheDeepThing from "./node_modules/side-effecty/doTheThing.js";
            `,
        }
    },
});