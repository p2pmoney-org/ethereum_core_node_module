console.log('ethnode-load.js');

var Bootstrap = window.simplestore.Bootstrap;
var ScriptLoader = window.simplestore.ScriptLoader;

var bootstrapobject = Bootstrap.getBootstrapObject();
var rootscriptloader = ScriptLoader.getRootScriptLoader();


var modulescriptloader = ScriptLoader.findScriptLoader('moduleloader');

var ethnodemodulescriptloader = modulescriptloader.getChildLoader('ethnodeloader-2');

rootscriptloader.push_import(ethnodemodulescriptloader,'../../imports/js/src/xtra/modules/ethnode/module.js');
import  '../../imports/js/src/xtra/modules/ethnode/module.js';


rootscriptloader.push_import(ethnodemodulescriptloader,'../../imports/js/src/xtra/modules/ethnode/control/controllers.js');
import  '../../imports/js/src/xtra/modules/ethnode/control/controllers.js';

rootscriptloader.push_import(ethnodemodulescriptloader,'../../imports/js/src/xtra/modules/ethnode/model/contracts.js');
import  '../../imports/js/src/xtra/modules/ethnode/model/contracts.js';
rootscriptloader.push_import(ethnodemodulescriptloader,'../../imports/js/src/xtra/modules/ethnode/model/contractinstance.js');
import  '../../imports/js/src/xtra/modules/ethnode/model/contractinstance.js';
rootscriptloader.push_import(ethnodemodulescriptloader,'../../imports/js/src/xtra/modules/ethnode/model/transaction.js');
import  '../../imports/js/src/xtra/modules/ethnode/model/transaction.js';


ethnodemodulescriptloader.load_scripts();
