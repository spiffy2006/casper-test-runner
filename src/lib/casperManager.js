/**
 * Created by jcox on 6/3/16.
 */

import * as Q from 'q';

export default class CasperManager {
    /**
     * Class to manage casper and DOM interactions
     * @param casper The casper object passed as global
     * @param phantom The phantom object passed as global
     */
    constructor(casper, phantom) {
        this.casper = casper;
        this.phantom = phantom;

        this.failCount = 0;
        this.baseName = '';
    }

    /**
     * Sets the current baseName for logging output and image captures
     * @param {string} baseName The folder name for logging output and image captures
     */
    setCurrentBaseName(baseName) {
        this.baseName = baseName;
    }

    /**
     * Set debug options in casper
     *
     * @param {Boolean} debug Whether to have debug mode turned on
     *
     * @returns {void}
     */
    setDebug(debug) {
        let self = this;

        if (this.casper.cli.get('trace') == true) {
            debug = true;
        }
        this.casper.on(
            'page.error',
            function (msg, trace) {
                if (debug) {
                    self.casper.echo( 'Error: ' + msg, 'ERROR\n' );
                    for(var i in trace) {
                        self.casper.echo(JSON.stringify(trace[i]));
                    }
                }
            }
        );
        this.casper.on(
            'remote.message',
            function(msg) {
                if (debug) {
                    self.casper.echo('remote console message: ' + msg);
                }
            }
        );
        this.casper.test.on(
            'fail',
            function() {
                self.failCount++;
                self.casper.capture('screenshots/'+ self.baseName + '/' + self.baseName + '_fail_' + self.failCount + '.png');
                self.casper.echo("Failed - image captured");
            }
        );
    }

    /**
     * Clicks an element in the DOM after waiting for the element to be there
     *
     * @param {string} selector The selector of the element to be clicked
     *
     * @returns {void}
     */
    click(selector) {
        let self = this;

        this.waitForSelector(selector, () => {
            self.casper.click(selector);
        });
    }

    /**
     * Retrieves the text from an element
     *
     * @param {string} selector The selector of the element from which to get the text
     *
     * @returns {*} Promise that resolves with the text
     */
    getText(selector) {
        let self = this,
            deferred = Q.defer();

        this.waitForSelector(selector, () => {
            deferred.resolve(self.casper.fetchText(selector));
        });

        return deferred.promise;
    }

    /**
     * Waits for a selector to be available on the page
     *
     * @param {string} selector The selector for which to wait
     * @param {Function} args The rest of the arguments. ie callback, onTimeout, timeout
     *
     * @returns {void}
     */
    waitForSelector(selector, ...args) {
        let self = this;

        this.casper.then(() => {
            self.casper.waitForSelector(selector, ...args);
        });
    }

    /**
     * Wrapper for wait methods to make them psuedo synchronous
     *
     * @param method The wait method to call
     * @param selector The selector to wait for
     * @param args The rest of the arguments
     *
     * @returns {void}
     */
    waitFor(method, selector, ...args) {
        if (this.casper[method] && method.indexOf('wait') > -1) {
            this.casper.then(() =>{
                self.casper[method](selector, ...args);
            });
        } else {
            throw new Error("Param 'method' must be a casperjs wait function.")
        }
    }

    /**
     * Waits until selector no longer exists in the DOM
     *
     * @param {string} selector The selector of the element to wait for
     * @param args All of the other arguments. ie callback, onTimeout, and timeout
     *
     * @returns {void}
     */
    waitWhileSelector(selector, ...args) {
        let self = this;

        this.waitForSelector(selector, () => {
            self.casper.waitWhileSelector(selector, ...args);
        });
    }

    /**
     * Evaluates an expression in the current page DOM context
     *
     * @param {Object} params The params to be used in the evaluate callback
     * @param {Function} cb The script to execute against the DOM
     * @param {string} waitForSelector Optional selector to wait for before executing the callback
     *
     * @returns {*|promise}
     */
    evaluate(params, cb, waitForSelector) {
        let self = this,
            deferred = Q.defer();

        if (waitForSelector) {
            this.waitForSelector(waitForSelector, () => {
                let response = self.casper.evaluate(cb, params);
                deferred.resolve(response);
            });
        } else {
            this.casper.then(() => {
                let response = self.casper.evaluate(cb, params);
                deferred.resolve(response);
            });
        }

        return deferred.promise;
    }

    /**
     * Types text into an input field
     *
     * @param {string} selector The selector of the field to type into
     * @param {string} keys The text to type
     */
    sendKeys(selector, keys) {
        let self = this;

        this.waitForSelector(selector, () => {
            self.evaluate({selector, keys}, (selector, keys) => {
                document.querySelector(selector).value = keys;
            }, selector);
        });
    }

    /**
     * Helper method for casper element getters
     * 
     * @param {string} selector The element selector
     * @param {Function} getter the casper method to call
     * @param {string?} attr (Optional) The attribute to get from the element
     * @returns {*|promise}
     */
    elementGetHelper(selector, getter, attr) {
        let deferred = Q.defer();

        this.waitForSelector(selector, () => {
            let arr;
            
            if (attr) {
                arr = getter(selector, attr);
            } else {
                arr = getter(selector);
            }
            
            deferred.resolve(arr.length == 1 ? arr[0] : arr);
        });

        return deferred.promise;
    }

    /**
     * Gets an attibute from all elements matching the selector
     *
     * @param {string} selector The element selector
     * @param {string} attr The attribute to get
     * 
     * @returns {*|promise}
     */
    getAttribute(selector, attr) {
        return this.elementGetHelper(selector, this.casper.getElementsAttribute, attr);
    }

    /**
     * Retrieves the boundaries (coordinates) of the elements with the given selector
     *
     * @param {string} selector The element selector
     * 
     * @returns {*|promise}
     */
    getBounds(selector) {
        return this.elementGetHelper(selector, this.casper. getElementsBounds);
    }

    /**
     * Retrieves all of the info of the elements with the given selector
     *
     * @param {string} selector The element selector
     *
     * @returns {*|promise}
     */
    getInfo(selector) {
        return this.elementGetHelper(selector, this.casper.getElementsInfo);
    }

    /**
     * Retrieves the casper instance
     * 
     * @returns {*}
     */
    getCasper() {
        return this.casper;
    }

    /**
     * Retrieves the phantom instance
     * 
     * @returns {*}
     */
    getPhantom() {
        return this.phantom;
    }

    /**
     * Sets the test object from casperjs
     *
     * @param {Object} test The casperjs test object
     *
     * @returns {void}
     */
    setTestObject(test) {
        this.test = test;
    }

    /**
     * Uses the casperjs test.comment function if available, or uses casper.echo if not, and is beautifully wrapped in a casper.then
     *
     * @param {String} text The text to write to the console
     *
     * @returns {void}
     */
    comment(text) {
        this.casper.then(() => {
            if (this.test) {
                this.test.comment(text);
            } else {
                this.casper.echo('# ' + text);
            }
        });
    }

    /**
     * casper.echo wrapper that places the echo in a casper.then
     *
     * @param {String} text The text to write to the console
     *
     * @returns {void}
     */
    echo(text) {
        this.casper.then(() => {
            this.casper.echo(text);
        });
    }

    /**
     * Wrapper for all casperjs asserts, because I am too lazy to write them all out
     *  Wraps method in a casper.then and spreads arguments out into the actual method
     *
     * @param method The assert method to call
     * @param args Array of arguments converted from actual arguments (Thank you es6)
     */
    assert(method, ...args) {
        if (this.test[method] && method.indexOf('assert') > -1) {
            this.casper.then(() => {
                this.test[method](...args);
            });
        } else {
            throw new Error("Param method must be a valid casperjs test assert method.")
        }
    }
}