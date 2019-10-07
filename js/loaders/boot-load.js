console.log('boot-load.js');

// we load global scope
var Bootstrap = window.simplestore.Bootstrap;
var ScriptLoader = window.simplestore.ScriptLoader;

var bootstrapobject = Bootstrap.getBootstrapObject();
var rootscriptloader = ScriptLoader.getRootScriptLoader();


var bootstraploader = rootscriptloader.getChildLoader('bootstrap');

rootscriptloader.push_import(bootstraploader, '../../imports/includes/constants.js');
import '../../imports/includes/constants.js';

rootscriptloader.push_import(bootstraploader, '../../imports/includes/config.js');
import '../../imports/includes/config.js';

// global scope object
rootscriptloader.push_import(bootstraploader, '../../imports/includes/global.js');
import '../../imports/includes/modules/common/global.js';


bootstraploader.load_scripts(function() {
	rootscriptloader.signalEvent('on_bootstrap_load_end');
});

