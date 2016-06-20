/**
 * Created by jcox on 6/20/16.
 */

export const description = 'Example Test Suite';
export const numTests = 2;

export default class Example1 {
    constructor(cm) {
        this.cm = cm;
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
}