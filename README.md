# casper-test-runner


## Prerequisites

This module runs on es6 and expects that your tests are also written in es6 and transpiled using babel before test run.
To do this you can download babel-cli and babel-preset-es2015 and have an npm script that transpiles and the runs the casper tests
```
npm install babel-cli babel-preset-es2015 --save-dev
```
And in your package.json file
```
{
  "scripts": {
    "e2e-tests": "./node_modules/babel-cli/bin/babel.js tests/e2e/src --presets babel-preset-es2015 --out-dir tests/e2e/dist && ./node_modules/casperjs/bin/casperjs test tests/e2e/dist/index.js"
  }
}
```
Then to run
```
npm run e2e-tests
```

### How To Use
Simply clone the repo
```
git clone https://github.com/spiffy2006/casper-test-runner.git
```
or npm install the module
```
npm install casper-test-runner --save-dev
```

Once it is installed create a your main test file
```
import CasperTestRunner from 'casper-test-runner';

let config = [ // these are the defaults
  'tests/e2e/dist/', // the location of your transpiled tests (path from project root)
  {width: 1024, height: 768, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:36.0) Gecko/20100101 Firefox/36.0'},
  'https://www.google.com/' // the url to open on startup
};
let ctr = new CasperTestRunner(casper, phantom, ...config);

ctr.setCasperOptions({put: 'your', casper: 'options', here: 'please'});

ctr.run();
```

### Writing Tests

Your tests will be written as an es6 class that takes one parameter in it's constructor. The parameter is a casper wrapper class that simplifies casper DOM interactions without all of the overhead of waiting for selectors and calling casper.then.
Everything in the casper wrapper class is also promise based. So, for example, if you call evaluate you just chain a then to it, and get your data from the evaluate back.

The tests in your class need to be annotated with an @test in a [DocBlock](http://devdocs.magento.com/guides/v2.0/coding-standards/docblock-standard-javascript.html) manner in order for the runner to recognize it as a test method. Each test should run 1 assert. If you are using more than 1 assert per @test, then you need to break it up a little more. This ensures test granularity, and that the test runner can accurately determine the number of tests you are running.

Here is an example of a basic test class
```
export const description = "This is your class description. What are you testing?";
export default class MyFirstTestClass {
  constructor(cm) {
    this.cm = cm; // casper wrapper
    this.button = '.some-selector';
  }
  
  setUpBefore() {
    // This is where you will run anything that has a one time set up before the test(s) start running.
  }
  
  setUp() {
    // This method gets called before each test in your class
  }
  
  /**
  * This is a description of the test
  * @test <-- This is what tells the test runner that this is a test method
  * @param test
  */
  doTheThings(test) {
    // test is the casper test object that contains all of your assert functions that casper gives you
    this.cm.click(this.button); // click something
    test.assert(true, "true is true");
  }
  
  tearDown() {
    // This method is called after each test in your class
  }
  
  tearDownAfter() {
    // This method is called after all of your tests are completed
  }
}
```

### Testing Tests
To test a test class or multiple test classes:
```
npm run e2e-tests -- --testFiles=path/to/your/test.js,path/to/different/test.js
```

testFiles is a comma separated string with the relative path from the test directory specified in your run.js file.

So if your tests are in ```tests/e2e/dist``` and your test class that you want to run is in ```tests/e2e/dist/google/testSearch.test.js``` you would run the command
```npm run e2e-tests -- --testFiles=google/testSearch.test.js``` to test that class.

## Writing Library Classes

When writing classes that interact with the DOM the Page Object Model (POM) design pattern should be used. See this article as a reference [POM](http://martinfowler.com/bliki/PageObject.html)

Example google.com homepage POM class
```
import GoogleSRP from './GoogleSRP';

export default class GoogleHomePage {
  constructor(cm) {
    this.cm = cm; // CasperManager instance
    this.casper = cm.getCasper(); // raw casper object
    this.phantom = cm.getPhantom(); // raw phantom object
    
    // page elements
    this.searchBox = '#lst-ib';
    this.searchBtn = '[name="btnK"]';
    this.feelingLuckyBtn = '#gbqfbb';
  }
  
  enterSearch(searchStr) {
    this.cm.sendKeys(this.searchBox, searchStr);
  }
  
  search(searchStr) {
    this.enterSearch(searchStr);
    this.cm.click(this.searchBtn);
    return new GoogleSRP(this.cm); // returns instance of GoogleSRP class for easy method chaining
  }
  
  feelingLucky(searchStr) {
    this.enterSearch(searchStr);
    this.cm.click(this.feelingLuckyBtn);
    return new GoogleSRP(this.cm); // returns instance of GoogleSRP class for easy method chaining
  }
  
  getSearchText() {
    return this.cm.getText(this.searchBox); // returns promise
  }
}
```
