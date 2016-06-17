/**
 * Created by jcox on 6/6/16.
 */
import {browserDefaults, defaultStartUrl} from './lib/config';
import ConfigMapper from './lib/configMapper';
import CasperManager from './lib/casperManager';

export default class CasperTestRunner {
    constructor(casper, phantom, testPath, browser, startUrl) {
        this.casper = casper;
        this.phantom = phantom;
        this.cm = new CasperManager(casper, phantom);
        this.testPath = testPath;
        this.browser = ConfigMapper.map(browserDefaults, browser);
        this.startUrl = startUrl || defaultStartUrl;
        this.testFiles = [];
        this.tests = [];
        this.fs = require('fs');
        this.utils = require('utils');
        this.scriptName = this.fs.absolute( require("system").args[3] );
        this.scriptDirectory = this.scriptName.substring(0, this.scriptName.lastIndexOf('/'));
        this.setCasperOptions({viewportSize: {width: 1024, height: 2000}, waitTimeout: 50000});
    }

    setupBrowser() {
        this.casper.viewport(this.browser.width, browser.height);
        this.casper.userAgent(this.browser.userAgent);
    }

    setCasperOptions(options) {
        for (var k in options) {
            this.casper.options[k] = options[k];
        }
    }

    getTests(file) {
        let tests = [], regex = /key\:\s\'([\w\d-_]+)\'/gi, result;

        while (result = regex.exec(file)) {
            if (result[1] && result[1].match(/test/i)) {
                tests.push(result[1]);
            }
        }

        return tests;
    }

    findTestFiles(path) {
        let list = this.fs.list(path), file, fileData, className, tests;

        for (let i = 0; i < list.length; i++) {
            this.casper.echo(path + list[i]);
            file = path + list[i];

            // ignore current and parent directories
            if (list[i] == '.' || list[i] == '..') {
                continue;
            } else if (fs.isDirectory(file)) {
                this.findTestFiles(file + '/');
            } else if (this.fs.isFile(file) && list[i].indexOf('.test.js') != -1) {
                fileData = this.fs.read(file);
                className = fileData.match(/exports.default\s\=\s([\W\D-_]+);/);
                tests = this.getTests(fileData);
                if (className) {
                    this.testFiles.push({file, className: className[1], tests});
                }
            }
        }
    }

    runTest(testObj) {
        let mod = require(this.scriptDirectory + '/' + testObj.file);
        let inst = new mod.default(this.cm);

        this.casper.test.begin(mod.description, mod.numTests, (test) => {
            this.cm.setDebug(false, mod.description.replace(/\s/g, ''));
            this.casper.start(this.startUrl, () => {
                this.setupBrowser();
            });

            if (inst.setUpBefore) {
                inst.setUpBefore();
            }

            for (let i = 0; i < testObj.tests.length; i++) {
                if (inst.setUp) {
                    inst.setUp();
                }
                inst[testObj.tests[i]](test);
                if (inst.tearDown) {
                    inst.tearDown();
                }
            }

            if (inst.tearDownAfter) {
                inst.tearDownAfter();
            }

            this.casper.run(
                () => {
                    test.done();
                    setTimeout(
                        () => {
                            this.phantom.exit();
                        },
                        10
                    );
                }
            );
        });
    }

    run() {
        this.setupBrowser();
        // get all the test information
        this.findTestFiles(this.testPath);

        // run all the tests
        for (var i = 0; i < this.testFiles.length; i++) {
            this.runTest(this.testFiles[i]);
        }
    }
}