/**
 * Created by jcox on 6/3/16.
 */

import * as Q from 'q';

export default class CasperManager {
    constructor(casper, phantom) {
        this.casper = casper;
        this.phantom = phantom;

        this.failCount = 0;
    }

    setDebug(debug, baseName) {
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
                self.casper.capture('screenshots/'+ baseName + '/' + baseName + '_fail_' + self.failCount + '.png');
                self.casper.echo("Failed - image captured");
            }
        );
    }

    click(selector) {
        let self = this;

        this.waitForSelector(selector, () => {
            self.casper.click(selector);
        });
    }

    waitForSelector(selector, cb) {
        let self = this;

        this.casper.then(() => {
            self.casper.waitForSelector(selector, cb);
        });
    }

    waitWhileSelector(selector) {
        let self = this;

        this.waitForSelector(selector, () => {
            self.casper.waitWhileSelector(selector);
        });
    }

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

    sendKeys(selector, keys) {
        let self = this;

        this.waitForSelector(selector, () => {
            self.casper.sendKeys(selector, keys);
        });
    }

    elementGetHelper(selector, getter) {
        let deferred = Q.defer();

        this.waitForSelector(selector, () => {
            let arr = getter(selector, attr);
            deferred.resolve(arr.length == 1 ? arr[0] : arr);
        });

        return deferred.promise;
    }

    getAttribute(selector, attr) {
        return this.elementGetHelper(selector, this.casper.getElementsAttribute);
    }

    getBounds(selector) {
        return this.elementGetHelper(selector, this.casper.getElementsBounds);
    }

    getInfo(selector) {
        return this.elementGetHelper(selector, this.casper.getElementsInfo);
    }

    getCasper() {
        return this.casper;
    }

    getPhantom() {
        return this.phantom;
    }
}