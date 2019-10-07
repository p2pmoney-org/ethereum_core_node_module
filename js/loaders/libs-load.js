console.log('libs-load.js');

var Bootstrap = window.simplestore.Bootstrap;
var ScriptLoader = window.simplestore.ScriptLoader;

var bootstrapobject = Bootstrap.getBootstrapObject();
var rootscriptloader = ScriptLoader.getRootScriptLoader();


var globalscriptloader = ScriptLoader.findScriptLoader('globalloader')


//libs
var libscriptloader = globalscriptloader.getChildLoader('libloader');

//interfaces to abstract access to standard libs
rootscriptloader.push_import(libscriptloader,'../../imports/js/src/xtra/interface/ethereum-node-access.js');
import '../../imports/js/src/xtra/interface/ethereum-node-access.js';

var ethereumnodeaccessmodulescriptloader = libscriptloader.getChildLoader('ethereumnodeaccessmoduleloader-2');

ethereumnodeaccessmodulescriptloader.push_script( '../../includes/lib/web3.min-1.0.0-beta36.x.js');
//import '../../includes/lib/web3.min-1.0.0-beta36.x.js';

// put Web3 in window.simplestore
var Web3 = require('web3');
window.simplestore.Web3 = Web3;

ethereumnodeaccessmodulescriptloader

//perform load
libscriptloader.load_scripts();
