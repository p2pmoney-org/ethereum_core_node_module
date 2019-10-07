console.log('ethchainreader-load.js');

var Bootstrap = window.simplestore.Bootstrap;
var ScriptLoader = window.simplestore.ScriptLoader;

var bootstrapobject = Bootstrap.getBootstrapObject();
var rootscriptloader = ScriptLoader.getRootScriptLoader();


var modulescriptloader = ScriptLoader.findScriptLoader('moduleloader');

var ethreadermodulescriptloader = modulescriptloader.getChildLoader('ethchainreaderloader-2');

rootscriptloader.push_import(ethreadermodulescriptloader,'../../imports/js/src/xtra/modules/ethchainreader/module.js');
import  '../../imports/js/src/xtra/modules/ethchainreader/module.js';
rootscriptloader.push_import(ethreadermodulescriptloader,'../../imports/js/src/xtra/modules/ethchainreader/chainreader-interface.js');
import  '../../imports/js/src/xtra/modules/ethchainreader/chainreader-interface.js';


rootscriptloader.push_import(ethreadermodulescriptloader,'../../imports/js/src/xtra/modules/ethchainreader/control/controllers.js');
import  '../../imports/js/src/xtra/modules/ethchainreader/control/controllers.js';

rootscriptloader.push_import(ethreadermodulescriptloader,'../../imports/js/src/xtra/modules/ethchainreader/model/account.js');
import  '../../imports/js/src/xtra/modules/ethchainreader/model/account.js';
rootscriptloader.push_import(ethreadermodulescriptloader,'../../imports/js/src/xtra/modules/ethchainreader/model/block.js');
import  '../../imports/js/src/xtra/modules/ethchainreader/model/block.js';
rootscriptloader.push_import(ethreadermodulescriptloader,'../../imports/js/src/xtra/modules/ethchainreader/model/contract.js');
import  '../../imports/js/src/xtra/modules/ethchainreader/model/contract.js';
rootscriptloader.push_import(ethreadermodulescriptloader,'../../imports/js/src/xtra/modules/ethchainreader/model/ethnode.js');
import  '../../imports/js/src/xtra/modules/ethchainreader/model/ethnode.js';
rootscriptloader.push_import(ethreadermodulescriptloader,'../../imports/js/src/xtra/modules/ethchainreader/model/transaction.js');
import  '../../imports/js/src/xtra/modules/ethchainreader/model/transaction.js';

ethreadermodulescriptloader.load_scripts();
