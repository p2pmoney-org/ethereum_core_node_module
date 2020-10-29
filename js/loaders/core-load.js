console.log('core-load.js');

var Bootstrap = window.simplestore.Bootstrap;
var ScriptLoader = window.simplestore.ScriptLoader;

var bootstrapobject = Bootstrap.getBootstrapObject();
var rootscriptloader = ScriptLoader.getRootScriptLoader();

var globalscriptloader = ScriptLoader.findScriptLoader('globalloader');

globalscriptloader.push_script('../../imports/js/src/config.js');
import '../../imports/js/src/config.js';

globalscriptloader.push_script('../../imports/js/src/constants.js', function() {
	var Constants = window.simplestore.Constants;
	Constants.push('lifecycle', {eventname: 'app start', time: Date.now()});
});
import '../../imports/js/src/constants.js';


//perform load
globalscriptloader.load_scripts();



// core load
var corescriptloader = rootscriptloader.getChildLoader('coreloader');

rootscriptloader.push_import(corescriptloader,'../../imports/includes/interface/cryptokey-encryption.js');
import '../../imports/includes/interface/cryptokey-encryption.js';

// external libraries for crypto
var cryptomodulescriptloader = corescriptloader.getChildLoader('cryptokeyencryptionmoduleloader-2');

//
// ethereumjs
//
rootscriptloader.push_import(cryptomodulescriptloader, '../../imports/includes/lib/ethereumjs-all-2017-10-31.min.js');
//import '../../imports/includes/lib/ethereumjs-all-2017-10-31.min.js';
// filtered libraries (throwing exceptions in nodejs)
var ethereumjs;

ethereumjs = require('ethereum.js');
ethereumjs.Util = require('ethereumjs-util');
ethereumjs.Wallet = require('ethereumjs-wallet');
ethereumjs.Tx = require('ethereumjs-tx');


function _getBufferClass() {
	if (typeof Buffer !== 'undefined')
		return Buffer;
	else if (typeof window !== 'undefined' && (typeof window.simplestore !== 'undefined') && (typeof window.simplestore.Buffer !== 'undefined'))
		return window.simplestore.Buffer;
	else if ((typeof global !== 'undefined') && (typeof global.simplestore !== 'undefined') && (typeof global.simplestore.Buffer !== 'undefined'))
		return global.simplestore.Buffer;
	else
		throw 'can not find Buffer class!!!';
}

var _Buffer = _getBufferClass();

ethereumjs.Buffer = {};
ethereumjs.Buffer.Buffer = _Buffer.from;
ethereumjs.Buffer.Buffer.from = _Buffer.from;

window.simplestore.ethereumjs = ethereumjs;

//
// keythereum
//
rootscriptloader.push_import(cryptomodulescriptloader, '../../imports/includes/lib/keythereum.min-1.0.2.js');
//import '../../imports/includes/lib/keythereum.min-1.0.2.js';

//duplicate window reference to window.simplestore after import
window.simplestore.keythereum = window.keythereum;

// when using keythereum node module
var keythereum = require('keythereum');
window.simplestore.keythereum = keythereum;

//
// bit core
//
rootscriptloader.push_import(cryptomodulescriptloader, '../../includes/lib/bitcore.min-0.11.7.x.js');
//import '../../includes/lib/bitcore.min-0.11.7.x.js';

rootscriptloader.push_import(cryptomodulescriptloader, '../../includes/lib/bitcore-ecies.min-0.9.2.x.js');
//import '../../includes/lib/bitcore-ecies.min-0.9.2.x.js';

var bitcore = require('bitcore');
var bitcore_ecies = require('bitcore-ecies');

window.simplestore.bitcore = bitcore;
window.simplestore.bitcore_ecies = bitcore_ecies;


cryptomodulescriptloader.load_scripts();



// interfaces to access external services (crypto and storage)
rootscriptloader.push_import(corescriptloader,'../../imports/includes/interface/account-encryption.js');
import '../../imports/includes/interface/account-encryption.js';

rootscriptloader.push_import(corescriptloader,'../../imports/includes/interface/cryptokey-encryption.js');
import '../../imports/includes/interface/cryptokey-encryption.js';

rootscriptloader.push_import(corescriptloader,'../../imports/includes/interface/storage-access.js');
import '../../imports/includes/interface/storage-access.js';

//common module object (here to be coherent with browser load sequence)
rootscriptloader.push_import(corescriptloader,'../../imports/includes/modules/common/module.js');
import '../../imports/includes/modules/common/module.js';


corescriptloader.load_scripts(function () {
	// signal end of core framework load
	rootscriptloader.signalEvent('on_core_load_end');	
});





// common module
var commonmodulescriptloader = globalscriptloader.getChildLoader('commonmoduleloader-2');

rootscriptloader.push_import(commonmodulescriptloader, '../../imports/includes/modules/common/control/controllers.js');
import '../../imports/includes/modules/common/control/controllers.js';

rootscriptloader.push_import(commonmodulescriptloader, '../../imports/includes/modules/common/model/localstorage.js');
import '../../imports/includes/modules/common/model/localstorage.js';

rootscriptloader.push_import(commonmodulescriptloader, '../../imports/includes/modules/common/model/localvault.js');
import '../../imports/includes/modules/common/model/localvault.js';

rootscriptloader.push_import(commonmodulescriptloader, '../../imports/includes/modules/common/model/restconnection.js');
import '../../imports/includes/modules/common/model/restconnection.js';

rootscriptloader.push_import(commonmodulescriptloader, '../../imports/includes/modules/common/model/cryptokey.js');
import '../../imports/includes/modules/common/model/cryptokey.js';

rootscriptloader.push_import(commonmodulescriptloader, '../../imports/includes/modules/common/model/account.js');
import '../../imports/includes/modules/common/model/account.js';

rootscriptloader.push_import(commonmodulescriptloader, '../../imports/includes/modules/common/model/user.js');
import '../../imports/includes/modules/common/model/user.js';

rootscriptloader.push_import(commonmodulescriptloader, '../../imports/includes/modules/common/model/session.js'); // should be last
import '../../imports/includes/modules/common/model/session.js';

commonmodulescriptloader.load_scripts();




