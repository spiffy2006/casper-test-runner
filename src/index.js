/**
 * Created by jcox on 6/6/16.
 */
import {browserDefaults, defaultStartUrl} from './lib/config';
import ConfigMapper from './lib/configMapper';
import CasperManager from './lib/casperManager';

export default class CasperTestRunner {
    /**
     * Runs casper tests in a given dist folder transpiled from es6 using babel
     * 
     * @param {Object} casper The casperjs instance
     * @param {Object} phantom The phantomjs instance
     * @param {string} testPath The relative path to the transpiled casper tests
     * @param {Object<number, string>} browser The browser width, height, and userAgent for the test
     * @param {string} startUrl The url to start the test
     */
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
        this.scriptName = this.fs.absolute( require("system").args[3] );
        this.scriptDirectory = this.scriptName.substring(0, this.scriptName.lastIndexOf('/'));
        this.setCasperOptions({viewportSize: {width: 1024, height: 2000}, waitTimeout: 50000});
        this.testSuitesCompleted = 0;
    }

    /**
     * Sets the casper browser options
     * @returns {void}
     */
    setupBrowser() {
        this.casper.viewport(this.browser.width, this.browser.height);
        this.casper.userAgent(this.browser.userAgent);
    }

    /**
     * Sets casper options in the casper.options object
     * 
     * @param {Object} options The options to set in casper
     * 
     * @returns {void}
     */
    setCasperOptions(options) {
        for (var k in options) {
            this.casper.options[k] = options[k];
        }
    }

    /**
     * Whether there were specific tests passed through the cli
     * 
     * @returns {boolean}
     */
    cliHasTests() {
        return this.casper.cli.has('tests');
    }

    /**
     * Gets the tests from the cli and returns them in an array
     * 
     * @returns {Array}
     */
    getCliTests() {
        let tests = [];
        this.casper.cli.get('tests').split(',').forEach((test) => {
            tests.push(test);
        });

        return tests;
    }

    /**
     * Gets all of the test function names from a file
     * 
     * @param {string} file The contents of a test class file
     * 
     * @returns {Array} The tests found in the file
     */
    getTests(file) {
        if (this.cliHasTests()) {
            return this.getCliTests();
        }

        let tests = [], regex = /\@test[\s\S]+?(?=key:\s?[\"\'])key:\s?[\"\']([\w\d-_]+)[\"\']/gi, result;

        while (result = regex.exec(file)) {
            if (result[1]) {
                tests.push(result[1]);
            }
        }

        return tests;
    }

    /**
     * Retrieves all of the test files and puts all of their information into the testFiles array
     * 
     * @param {string} path The path to the tests
     */
    findTestFiles(path) {
        let list = this.fs.list(fs.workingDirectory + '/' + path), file, fileData, className, tests;

        for (let i = 0; i < list.length; i++) {
            file = path + list[i];

            // ignore current and parent directories
            if (list[i] == '.' || list[i] == '..') {
                continue;
            } else if (fs.isDirectory(file)) {
                this.findTestFiles(file + '/');
            } else if (this.fs.isFile(file) && list[i].indexOf('.test.js') != -1) {
                fileData = this.getFileData(file);
                if (fileData) {
                    this.testFiles.push(fileData);
                }
            }
        }
    }

    /**
     * Parses the test file, and and gets the class name and the test method names
     *
     * @param {string} file The path to the test file
     *
     * @returns {*}
     */
    getFileData(file) {
        let fileData = this.fs.read(file);
        let className = fileData.match(/exports.default\s\=\s([\w\d-_]+);/);
        let tests = this.getTests(fileData);
        if (className) {
            return {file, className: className[1], tests};
        } else {
            return null;
        }
    }

    /**
     * Exits phantomjs
     */
    exitPhantom() {
        setTimeout(() => {
                this.phantom.exit();
            }, 1000);
    }

    /**
     * Runs a test with the given test params
     * 
     * @param {Object<string, Array>} testObj 
     * 
     * @returns {void}
     */
    runTest(testObj) {
        let mod = require(this.scriptDirectory + '/' + testObj.file);

        this.casper.test.begin(mod.description, testObj.tests.length, (test) => {
            this.casper.then(() => {
                this.cm.setTestObject(test);
                this.cm.setCurrentBaseName(mod.description.replace(/\s/g, ''));
    
                let inst = new mod.default(this.cm);

                if (inst.setUpBefore) {
                    this.casper.then(() => {
                        inst.setUpBefore();
                    });
                }
    
                for (let i = 0; i < testObj.tests.length; i++) {
                    if (inst.setUp) {
                        this.casper.then(() => {
                            inst.setUp();
                        });
                    }
                    this.casper.then(() => {
                        this.cm.comment("Executing test: " + testObj.tests[i]);
                        inst[testObj.tests[i]](test);
                    });
                    if (inst.tearDown) {
                        this.casper.then(() => {
                            inst.tearDown();
                        });
                    }
                }
    
                if (inst.tearDownAfter) {
                    this.casper.then(() => {
                        inst.tearDownAfter();
                    });
                }
                
                this.casper.then(() => {
                    test.done();
                    this.testSuitesCompleted++;
    
                    if (this.testSuitesCompleted == this.testFiles.length) {
                        this.exitPhantom();
                    }
                });
            });
        });
    }

    /**
     * Checks to see if the testFiles flag has been passed and puts them in the testFiles array if they have
     *
     * @returns {boolean}
     */
    getCliTestFiles() {
        let self = this;

        if (!this.casper.cli.has('testFiles')) {
            return false;
        } else {
            this.casper.cli.get('testFiles').split(',').forEach((fileName) => {
                let fileData = self.getFileData(self.testPath + fileName);
                if (fileData) {
                    self.testFiles.push(fileData);
                }
            });

            return true;
        }
    }

    /**
     * Runs all of the test in the given test folder
     * 
     * @returns {void}
     */
    run() {
        if (!this.getCliTestFiles()) {
            // get all the test information
            this.findTestFiles(this.testPath);
        }

        this.cm.setDebug(false);
        this.casper.start(this.startUrl, () => {
            this.setupBrowser();
        });

        // run all the tests
        for (var i = 0; i < this.testFiles.length; i++) {
            this.runTest(this.testFiles[i]);
        }

        this.casper.run();
    }
}