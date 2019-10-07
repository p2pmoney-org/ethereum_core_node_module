console.log('xtra-load.js');

var Bootstrap = window.simplestore.Bootstrap;
var ScriptLoader = window.simplestore.ScriptLoader;

var bootstrapobject = Bootstrap.getBootstrapObject();
var rootscriptloader = ScriptLoader.getRootScriptLoader();

var globalscriptloader = ScriptLoader.findScriptLoader('globalloader')

var xtrascriptloader = globalscriptloader.getChildLoader('xtraconfig');

rootscriptloader.push_import(xtrascriptloader,'../../imports/js/src/xtra/xtra-config.js')
import '../../imports/js/src/xtra/xtra-config.js';

xtrascriptloader.load_scripts();
