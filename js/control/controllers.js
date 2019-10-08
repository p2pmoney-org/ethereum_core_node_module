'use strict';

var modulecontrollers;

var ModuleControllers = class {
	
	constructor() {
		this.module = null;
		
		this.ethereum_core = require('../../../ethereum_core').getObject();
		
		this.global = this.ethereum_core.getGlobalObject();

		this.session = null;
	}
	
	getCurrentSessionObject() {
		if (this.session)
			return this.session;
		
		this.session = this.createBlankSessionObject();
		
		return this.session;
	}
	
	createBlankSessionObject() {
		var global = this.global;
		var commonmodule = global.getModuleObject('common');

		this.session = commonmodule.createBlankSessionObject();
		
		return this.session;
	}

	
	getArtifact(artifactname) {
		return this.ethereum_core.getArtifact(artifactname);
	}
	
	//
	// Storage-access
	//
	getLocalJsonLeaf(session, keys, bForceRefresh, callback) {
		var localstorage = session.getLocalStorageObject();
		
		return localstorage.readLocalJson(keys, bForceRefresh, callback)
	}
	
	saveLocalJson(session, keys, json, callback) {
		var localstorage = session.getLocalStorageObject();
		
		localstorage.saveLocalJson(keys, json, callback)
	}
	
	//
	// Web 3 (ethnode)
	// 
	
	getNodeInfo(session, callback) {
		var global = this.global;
		
		var mobileconfigmodule = global.getModuleObject('mobileconfig');
		

		var ethnodemodule = global.getModuleObject('ethnode');

		var ethereumnodeaccess = ethnodemodule.getEthereumNodeAccessInstance(session);

		var nodeinfo = {};

		nodeinfo.islistening = global.t('loading');
		nodeinfo.networkid = global.t('loading');
		nodeinfo.peercount = global.t('loading');
		nodeinfo.issyncing = global.t('loading');
		nodeinfo.currentblock = global.t('loading');
		nodeinfo.highestblock = global.t('loading');

		var writenodeinfo = function(nodeinfo) {
			
			ethereumnodeaccess.web3_getNodeInfo(function(err, info) {
				console.log('returning from web3_getNodeInfo');
				
				if (info) {
					nodeinfo.islistening = info.islistening;
					nodeinfo.networkid = info.networkid;
					nodeinfo.peercount = info.peercount;
					nodeinfo.issyncing = info.issyncing;
					nodeinfo.currentblock = info.currentblock;
					nodeinfo.highestblock = info.highestblock;
				}
				else {
					nodeinfo.islistening = global.t('not available');
					nodeinfo.networkid = global.t('not available');
					nodeinfo.peercount = global.t('not available');
					nodeinfo.issyncing = global.t('not available');
					nodeinfo.currentblock = global.t('not available');
					nodeinfo.highestblock = global.t('not available');
				}

				console.log(JSON.stringify(nodeinfo));
				
				if (callback)
					callback(null, nodeinfo);
			});
		};

		writenodeinfo(nodeinfo);
	}
	
	_createAccount(session, address, privatekey) {
		var global = this.global;

		var commonmodule = global.getModuleObject('common');
		
		// create account with this address
		var account = commonmodule.createBlankAccountObject(session);
		
		if (privatekey)
			account.setPrivateKey(privatekey);
		else
			account.setAddress(address);
		
		return account;
	}
	
	getEthAddressBalance(session, address, callback) {
		var global = this.global;
		
		var commonmodule = global.getModuleObject('common');

		var account = this._createAccount(session, address);
		
		this.getEthAccountBalance(session, account, callback);
	}
	
	// using accounts
	getEthAccountFromUUID(session, accountuuid, callback) {
		var global = this.global;
		
		var commonmodule = global.getModuleObject('common');
		var commoncontrollers = commonmodule.getControllersObject();
		
		var account = commoncontrollers.getAccountObjectFromUUID(session, accountuuid);
		
		if (callback)
			callback(null, account);
	}
	
	getEthAccountBalance(session, account, callback) {
		var global = this.global;

		var ethnodemodule = global.getModuleObject('ethnode');
		var ethnodecontrollers = ethnodemodule.getControllersObject();

		ethnodemodule.getChainAccountBalance(session, account, function(err, res) {
			if (err) {
				if (callback)
					callback(err, null);
			}
			else {
				var etherbalance = (ethnodecontrollers ? ethnodecontrollers.getEtherStringFromWei(res) : null);
				if (callback)
					callback(err, etherbalance);
			}
		});
	}
	
	createFee(level) {
		var fee = {};
		
		fee.gaslimit = 4850000;
		fee.gasPrice = 10000000000;
		
		return fee;
	}
	
	createTransaction(session, fromaccount) {
		var global = this.global;
		
		var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');
	
		var ethereumtransaction =  ethereumnodeaccessmodule.getEthereumTransactionObject(session, fromaccount);
		
		return ethereumtransaction;
	}
	
	sendTransaction(session, transaction, callback) {
		var global = this.global;
		
		var ethnodemodule = global.getModuleObject('ethnode');
		
		var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');
		
		var EthereumNodeAccess = ethnodemodule.getEthereumNodeAccessInstance(session);
		
		
		return EthereumNodeAccess.web3_sendEthTransaction(transaction, callback);
	}
	
	getTransaction(session, txhash, callback) {
		var global = this.global;

		var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');

	    ethereumnodeaccessmodule.readEthereumTransactionObject(session, txhash, function(err, res) {
	    	console.log('callback from readEthereumTransactionObject');
	    	
	    	if (err) {
	    		if (callback)
	    			callback(err, null);
	    	}
	    	
	    })
	    .then(function(res) {
	    	console.log('readEthereumTransactionObject finished');
	    	
	    	if (res) {
	    		if (callback)
	    			callback(null, res);
	    	}
	    });
		
	}
	
	//
	// Web 3 (ethchainreader)
	//
	readCurrentBlockNumber(session, callback) {
		var global = this.global;
		
		var ethchainreadermodule = global.getModuleObject('ethchainreader');
		
		var chainreaderinterface = ethchainreadermodule.getChainReaderInterface(session);
		
		chainreaderinterface.getCurrentBlockNumber(callback);
	}
	
	readBlock(session, txhash, callback) {
		var global = this.global;
		
		var ethchainreadermodule = global.getModuleObject('ethchainreader');
		
		var chainreaderinterface = ethchainreadermodule.getChainReaderInterface(session);
		
		chainreaderinterface.getBlock(blocknumber, callback);
	}
	
	readTransaction(session, txhash, callback) {
		var global = this.global;
		
		var ethchainreadermodule = global.getModuleObject('ethchainreader');
		
		var chainreaderinterface = ethchainreadermodule.getChainReaderInterface(session);
		
		chainreaderinterface.getTransaction(txhash, callback);
	}

	
	//
	// cryptokey
	// 
	generatePrivateKey(session) {
		var privkey = session.generatePrivateKey();		
		
		return privkey;
		
	}
	
	getPublicKeys(session, privatekey) {
		var account = this._createAccount(session, null, privatekey);
		
		var keys = {};
		
		keys['private_key'] = account.getPrivateKey();
		keys['public_key'] = account.getPublicKey();
		keys['address'] = account.getAddress();
		keys['rsa_public_key'] = account.getRsaPublicKey();
		
		return keys;
	}
	
	aesEncryptString(session, privatekey, plaintext) {
		var cryptokey = session.createBlankCryptoKeyObject();
		cryptokey.setPrivateKey(privatekey);

		return cryptokey.aesEncryptString(plaintext);
		
	}
	
	aesDecryptString(session, privatekey, cyphertext) {
		var cryptokey = session.createBlankCryptoKeyObject();
		cryptokey.setPrivateKey(privatekey);

		return cryptokey.aesDecryptString(cyphertext);
	}
	
	rsaEncryptString(senderaccount, recipientaccount, plaintext) {
		return senderaccount.rsaEncryptString(plaintext, recipientaccount)
	}
	
	rsaDecryptString(recipientaccount, senderaccount, cyphertext) {
		return recipientaccount.rsaDecryptString(cyphertext, senderaccount)
	}
	
	
	// static
	static getObject() {
		if (modulecontrollers)
			return modulecontrollers;
		
		modulecontrollers = new ModuleControllers();
		
		return modulecontrollers;
	}
}

module.exports = ModuleControllers; 