/**
 * Created by jcox on 6/20/16.
 */

import CasperTestRunner from '../../dist/index';

let config = [ // these are the defaults
    'dist/examples/', // the location of your transpiled tests
    {width: 1024, height: 768, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:36.0) Gecko/20100101 Firefox/36.0'},
    'www.google.com' // the url to open on startup
];
let ctr = new CasperTestRunner(casper, phantom, ...config);


ctr.run();