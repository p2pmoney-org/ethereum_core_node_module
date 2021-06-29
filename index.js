/**
 * @author P2PMoney.org
 * @name @p2pmoney-org/ethereum_core
 * @homepage http://www.p2pmoney.org/
 * @license MIT
 */
'use strict';


console.log('@p2pmoney-org/ethereum_core node module');

if ( typeof window !== 'undefined' && window  && (typeof window.simplestore === 'undefined')) {
	// react-native
	console.log('creating window.simplestore in @p2pmoney-org/ethereum_core index.js');

	window.simplestore = {};
	
	window.simplestore.nocreation = true; // tell Bootstrap object we created simplestore
	
} else if ((typeof global !== 'undefined') && (typeof global.simplestore === 'undefined')) {
	// nodejs
	console.log('creating global.simplestore in @p2pmoney-org/ethereum_core index.js');
	global.simplestore = {};
}

// could be mutualized with above, but quick implementation for version 0.30.10 to avoid regressions
var globalscope;

if ( typeof window !== 'undefined' && window ) {
	globalscope = window;
}
else if (typeof global !== 'undefined') {
	globalscope = global;
}

if (globalscope.simplestore) {
	globalscope.simplestore.noconsoleoverload = true; // tell Bootstrap object not to overload console log
}

const Ethereum_core = require('./ethereum_core.js');


module.exports = Ethereum_core