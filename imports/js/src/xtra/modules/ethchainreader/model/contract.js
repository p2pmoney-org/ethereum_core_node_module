'use strict';

/*var TRUFFLE_BASE_ABI = [{
	      "constant": true,
	      "inputs": [],
	      "name": "contract_version",
	      "signature": "0xb32c65c8",
	      "outputs": [
	        {
	          "name": "",
	          "type": "uint256"
	        }
	      ],
	      "payable": false,
	      "stateMutability": "view",
	      "type": "function"
	    },
	    {
	      "constant": true,
	      "inputs": [],
	      "name": "contract_name",
	      "signature": "0xd9479692",
	      "outputs": [
	        {
	          "name": "",
	          "type": "string"
	        }
	      ],
	      "payable": false,
	      "stateMutability": "view",
	      "type": "function"
	    }
	  ];*/

var BASE_ABI = [{"constant":true,"inputs":[],"name":"contract_version","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"contract_name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"}];

var Contract = class {
	constructor(session, address) {
		this.session = session;
		this.address = address;
		this.abi = null;
		
		
		this.account = null;
		
		this.instance = null;
		
		this.getClass = function() { return this.constructor.getClass()};
	}
	
	getAccount() {
		return this.account;
	}

	getAbi() {
		return this.abi;
	}
	
	setAbi(abi) {
		this.abi = abi;
		
		// reset instance it created
		this.instance = null;
	}
	
	getMethodAbiDefinition(methodname) {
		var abi = this.getAbi();
		var abidef = null;
		
		if (!abi)
			return abidef;
		
		for (var i = 0; i < abi.length; i++) {
			var item = abi[i];
			var name = item.name;
			
			if (name == methodname) {
				abidef = item;
				
				break;
			}
		}
		
		return abidef;
	}
	
	// async
	getName(callback) {
		return Contract.getContractName(this.session, this.address, callback);
	}
	
	dynamicMethodCall(abidef, params, callback) {
		var self = this;

		var promise = this._getInstance()
		.then(function(instance) {
		    var global = Contract.getGlobalObject();
		    var chainreadermodule = global.getModuleObject('ethchainreader');
			
		    var EthereumNodeAccess = chainreadermodule.getEthereumNodeAccess(self.session);
			
			// need to call with a callback because _web3_contract_dynamicMethodCall was obsolete
			// and promise was not correct at the time for local (2020.10.15)
			// and remote returned only a promise
		    return new Promise(function(resolve, reject) {
				let handled = 0;

				EthereumNodeAccess._web3_contract_dynamicMethodCall(instance, abidef, params, function(err, res) {
					 if (err) {	handled = -1; reject(err); } else { handled = 1;resolve(res); }
				})
				.then(function(res) {
					if (handled == 0) { handled = 1;resolve(res); }
				})
				.catch(function (err) {
					 console.log('error: ' + err); // catch faulty promise rejection (2020.10.15)
					 if (handled == 0) { handled = -1; reject(err); }
				});	
			});	
		})
		.then(function (res) {
			if (callback)
			callback(null, res);
		
			return res;
		})
		.catch(function (err) {
			if (callback)
				callback(err, null);

			throw new Error(err);
		});
		
		return promise;
	}
	
	callReadMethod(methodname, methodparams, callback) {
		var value = null;
		
		var abidef = this.getMethodAbiDefinition(methodname);
		
		if (!abidef) {
			throw 'could not find method with name ' + methodname;
		}
		
		var constant = abidef.constant;
		var type = abidef.type;
		var payable = abidef.payable;
		var paramsnumber = abidef.inputs.length;
		var stateMutability = abidef.stateMutability;
		
		if (payable) {
			throw 'can not call a payable method: ' + methodname;
		}
		
		if (paramsnumber > methodparams.length) {
			throw 'not enough parameters have been passed for method: ' + paramsnumber;
		}
		
		var params = [];
		
		for (var i = 0; i < paramsnumber; i++) {
			// parameters have to be in the right order
			//var param = methodparams[i].value;
			var param = methodparams[i];
			
			params.push(param);
		}
		
		// make call
		var promise = this.dynamicMethodCall(abidef, params)
		.then(function (res) {

			if (callback)
				callback(null, res);
			
			return res;
		})
		.catch(function (err) {
			if (callback)
				callback(err, null);

			throw new Error(err);
		});
		
		return promise;
	}
	
	callGetter(abimethod, callback) {
		var self = this;

		var promise = this._getInstance()
		.then(function(instance) {
			var constant = abimethod.constant;
			var name = abimethod.name;
			var type = abimethod.type;
			var payable = abimethod.payable;
			var stateMutability = abimethod.stateMutability;
			var signature = abimethod.signature;
			var value = null;
			
			if (abimethod.type === "function" && abimethod.inputs.length === 0 && abimethod.constant) {
				// simple gets
				return this.callReadMethod(name, []);
			}	
			
		})
		.then(function (res) {
			if (callback)
			callback(null, res);
		
			return res;
		})
		.catch(function (err) {
			if (callback)
				callback(err, null);

			throw new Error(err);
		});
		
		return promise;
	}
	
	_getInstance(callback) {
		if (this.instance) {
			if (callback)
				callback(null, this.instance);
			
			return Promise.resolve(this.instance);
		}
		
		var abi = this.abi;
		var address = this.address;
		
		var Contract = this.getClass();
		
		var self = this;
		
	    var global = Contract.getGlobalObject();
	    var chainreadermodule = global.getModuleObject('ethchainreader');
	    
	    var EthereumNodeAccess = chainreadermodule.getEthereumNodeAccess(this.session);
	    
	    var promise = EthereumNodeAccess.web3_abi_load_at(abi, address, function(err, res)	 {
			var instance = res;
	    	self.instance = instance;
			
			if (instance)
				return instance;
			else
				throw new Error(err);
		})
		.then(function (res) {
			if (callback)
			callback(null, res);

			return res;
		})
		.catch(function (err) {
			if (callback)
			callback(err, null);

			throw new Error(err);
		});
	    
	    return promise;
	}

	// static
	static getContract(session, address, callback) {
		var contract = new Contract(session, address);

		var promise = Promise.resolve(contract)
		.then( function(res){
			if (callback)
			callback(null, contract);

			return contract;
		})
		.catch(function (err) {
			if (callback)
				callback(err, null);

			throw new Error(err);
		});

		return promise;
	}
	
	static getContractName(session, address, callback) {
		
		var contract = new Contract(session, address);
		
		contract.setAbi(BASE_ABI);
		
		return contract.callReadMethod('contract_name', [], callback);
	}
	
	static getContractVersion(session, address, callback) {
		
		var contract = new Contract(session, address);
		
		contract.setAbi(BASE_ABI);
		
		return contract.callReadMethod('contract_version', [], callback);

	}
}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
GlobalClass.registerModuleClass('ethchainreader', 'Contract', Contract);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('ethchainreader', 'Contract', Contract);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('ethchainreader', 'Contract', Contract);
}