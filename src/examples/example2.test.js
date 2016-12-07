/**
 * Created by jcox on 6/20/16.
 */

export const description = 'Example Test Suite 2';

export default class Example1 {
    constructor(cm) {
        this.cm = cm;
        this.casper = cm.getCasper();
    }

    /**
     * Tests that you can do something or whatever
     * @test
     * @param {Object} test The casperjs assertion object
     */
    doThingsAndStuff(test) {
        test.assert(true, "This works!");
    }

    /**
     * Another test to assert things
     * @test
     * @param {Object} test The casperjs assertion object
     */
    makeBoomBoom(test) {
        test.assert(true, "Also works!");
    }

    /**
     * Test the assert changes I just made
     * @test
     * @param {Object} test The casperjs assertion object
     */
    testAssert(test) {
        this.cm.comment("Wahoo!");
        this.cm.assert('assertEquals', [1, 2, 3], [1, 2, 3], 'blah blah blah, it works');
    }

    /**
     * Test the assert changes I just made
     * @test
     * @param {Object} test The casperjs assertion object
     */
    testWaitFor(test) {
        this.cm.waitFor('wait', 500, () => {
            this.cm.assert('assert', true, 'blah blah, it works');
        });
    }

    /**
     * Test that casper manager send keys works
     * @test
     * @param {Object} test The casperjs assertion object
     */
    testSendKeys(test) {
        let selector = '#searchInput';
        this.casper.thenOpen('https://wikipedia.org', () => {
            this.cm.sendKeys(selector, 'asdf');
            this.cm.evaluate(selector, (selector) => { return document.querySelector(selector).value; }, selector)
                .then((input) => {
                    this.cm.assert('assert', input == 'asdf', 'Send Keys Worked!');
                });
        });
    }
}