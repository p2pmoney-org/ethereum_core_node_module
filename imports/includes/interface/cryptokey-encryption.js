'use strict';

var Module = class {
	
	constructor() {
		this.name = 'cryptokey-encryption';
		
		this.global = null; // put by global on registration
		this.isready = false;
		this.isloading = false;
		
		this.ethereum_node_access_instance = null;
	}
	
	init() {
		console.log('module init called for ' + this.name);

		var global = this.global;
		
		this.isready = true;
	}
	
	// compulsory  module functions
	loadModule(parentscriptloader, callback) {
		console.log('loadModule called for module ' + this.name);

		if (this.isloading)
			return;
			
		this.isloading = true;

		var self = this;
		var global = this.global;
		
		var modulescriptloader = global.getScriptLoader('cryptokeyencryptionmoduleloader', parentscriptloader);

		var moduleroot = './includes/lib';

		if (global.isInBrowser()) {
			modulescriptloader.push_script( moduleroot + '/ethereumjs-all-2017-10-31.min.js');
			modulescriptloader.push_script( moduleroot + '/keythereum.min-1.0.2.js');
			modulescriptloader.push_script( moduleroot + '/bitcore.min-0.11.7.js');
			modulescriptloader.push_script( moduleroot + '/bitcore-ecies.min-0.9.2.js');
		}


		modulescriptloader.load_scripts(function() { self.init(); if (callback) callback(null, self); });
		
		return modulescriptloader;
	}
	
	isReady() {
		return this.isready;
	}

	hasLoadStarted() {
		return this.isloading;
	}

	// optional  module functions
	
	// objects
	getCryptoKeyEncryptionInstance(session, cryptokey) {
		if (!cryptokey)
			return;
		
		if (cryptokey.cryptokeyencryption)
			return cryptokey.cryptokeyencryption;
		
		console.log('instantiating CryptoKeyEncryption');
		
		var global = this.global;

		var result = [];
		var inputparams = [];
		
		inputparams.push(this);
		inputparams.push(session);
		inputparams.push(cryptokey);
		
		result[0] = new CryptoKeyEncryption(session, cryptokey);
		
		// call hook to let modify or replace instance
		var ret = global.invokeHooks('getCryptoKeyEncryptionInstance_hook', result, inputparams);
		
		if (ret && result[0]) {
			cryptokey.cryptokeyencryption = result[0];
		}
		else {
			cryptokey.cryptokeyencryption = new CryptoKeyEncryption(session, cryptokey);
		}
		
		return cryptokey.cryptokeyencryption;
	}
	
	pickCryptoKeyEncryptionInstance(session) {
		if (!session)
			return;
		
		// if we are not anonymous, we pick among user's cryptokeys
		// to avoid picking vaults' keys that are not necessarily always open
		var user = session.getSessionUserObject();
		
		var cryptokeys = (user ? user.getCryptoKeyObjects() : session.getSessionCryptoKeyObjects());
		var numberofcryptokeys = cryptokeys.length;
		
		if (numberofcryptokeys < 1)
			throw 'no crypto key defined in session to pick one';
		
		// we pick at random one of the crypto key in the session
		// (we could do a round robin, or a prefered key if necessary)
		var cryptokey = cryptokeys[Math.floor(Math.random() * numberofcryptokeys)];
		
		return cryptokey;
	}
	
	findCryptoKeyEncryptionInstanceFromUUID(session, keyuuid) {
		var cryptokeys = session.getSessionCryptoKeyObjects();
		
		for (var i = 0; i < cryptokeys.length; i++) {
			var cryptokey = cryptokeys[i];
			
			if (cryptokey.getKeyUUID() == keyuuid)
				return cryptokey;
		}
		
	}
	
	// private key encryption
	encryptPrivateKey(privatekey, cryptokey) {
		if (!privatekey)
			return null;
		
		if (!cryptokey)
			return privatekey;
		
		var cryptedprivatekey = cryptokey.aesEncryptString(privatekey);
		
		// add key uuid as prefix
		var encryptedprivatekey = cryptokey.getKeyUUID() + ':' + cryptedprivatekey;
		
		return encryptedprivatekey;
	}
	
	_findEncryptionCryptoKey(session, encryptedprivatekey) {
		if (!encryptedprivatekey)
			return null;
		
		// find crypto key uuid
		var keyuuid = encryptedprivatekey.substr(0, encryptedprivatekey.indexOf(':'));
		
		if (!keyuuid)
			return;
		
		var cryptokey = this.findCryptoKeyEncryptionInstanceFromUUID(session, keyuuid);
		
		if (!cryptokey)
			throw 'could not find crypto key with uuid: ' + keyuuid;
		
		return cryptokey;
	}
	
	decryptPrivateKey(session, encryptedprivatekey) {
		if (!encryptedprivatekey)
			return null;
		
		try {
			// find crypto key
			var cryptokey = this._findEncryptionCryptoKey(session, encryptedprivatekey);
			var _encryptedprivatekey;
			var _plainprivatekey;
			
			
			if (!cryptokey) {
				// see if it is a privatekey in clear
				var account = session.createBlankAccountObject();
				_plainprivatekey = encryptedprivatekey;
				
				account.setPrivateKey(_plainprivatekey);
				
				if (account.isPrivateKeyValid())
					return _plainprivatekey;
				
				throw 'could not decrypt private key';
			}
			else {
				_encryptedprivatekey = encryptedprivatekey.substring(encryptedprivatekey.indexOf(':') + 1);
				
				_plainprivatekey = cryptokey.aesDecryptString(_encryptedprivatekey);
				
				return _plainprivatekey;
			}
		}
		catch(e) {
			console.log('exception in decryptPrivateKey: ' + e);
		}
		
		
	}
	
	decryptKeyJson(session, keyjson) {
		if (!keyjson)
			return;
		
		try {
			var encryptedprivatekey = (keyjson['encrypted_private_key'] ? keyjson['encrypted_private_key'] : null);
			var plainprivatekey = this.decryptPrivateKey(session, encryptedprivatekey);

			keyjson['private_key'] = plainprivatekey;
			
			// put info concerning cryptokey in origin
			var origin = keyjson['origin'];
			
			if (!origin.encryption)
				origin.encryption = {};
			
			var cryptokey = this._findEncryptionCryptoKey(session, encryptedprivatekey);

			if (cryptokey) {
				origin.encryption.mode = 'cryptokey';
				origin.encryption.key_uuid = cryptokey.getKeyUUID();
				origin.encryption.address = cryptokey.getAddress();
				origin.encryption.description = cryptokey.getDescription();
				origin.encryption.origin = cryptokey.getOrigin();
				
				var owner = cryptokey.getOwner();
				
				if (owner) {
					origin.encryption.owner_uuid = owner.getUserUUID();
				}
			}
			else {
				origin.encryption.mode = 'none';
			}
		}
		catch(e) {
			console.log('exception in decryptKeyJson: ' + e);
		}
		
	}
	
	decryptJsonArray(session, jsonarray) {
		
		console.log('jsonarray length is ' + (jsonarray ? jsonarray.length : 0));
		
		// list of available owners (user and vaults)
		var owneruuidarray = [];
		
		var user = session.getSessionUserObject();
		var useruuid = (user ? user.getUserUUID() : null);
		
		owneruuidarray.push(useruuid);
		
		// crypto-keys
		var cryptokeyarray = session.getSessionCryptoKeyObjects();
		
		for (var i = 0; i < (cryptokeyarray ? cryptokeyarray.length : 0); i++) {
			var cryptokey = cryptokeyarray[i];
			var origin = cryptokey.getOrigin();
			if ( origin && (origin.storage == 'vault')) {
				owneruuidarray.push(cryptokey.getKeyUUID());
			}
		}
		
		var keysjson = [];

		for(var i = 0; i < (jsonarray ? jsonarray.length : 0); i++) {
			var uuid = (jsonarray[i]['uuid'] ? jsonarray[i]['uuid'] : null);
			var owneruuid = (jsonarray[i]['owner_uuid'] ? jsonarray[i]['owner_uuid'] : null);
			
			// we keep only our entries, based on owneruuid
			if (owneruuidarray.indexOf(owneruuid) != -1) {
				var keyuuid = (jsonarray[i]['key_uuid'] ? jsonarray[i]['key_uuid'] : (jsonarray[i]['uuid'] ? jsonarray[i]['uuid'] : null));
				var uuid = keyuuid;
				var address = (jsonarray[i]['address'] ? jsonarray[i]['address'] : null);
				var encryptedprivatekey = (jsonarray[i]['private_key'] ? jsonarray[i]['private_key'] : null);
				var description = (jsonarray[i]['description'] ? jsonarray[i]['description'] : null);
				var origin = (jsonarray[i]['origin'] ? jsonarray[i]['origin'] : {});
				var activated = (jsonarray[i]['activated'] !== null ? jsonarray[i]['activated'] : null);
				
				try {
					var keyjson = {uuid: uuid, key_uuid: keyuuid, owneruuid: owneruuid, address: address, encrypted_private_key: encryptedprivatekey, description: description, origin: origin, activated: activated}
					
					var privatekey = this.decryptKeyJson(session, keyjson);

					keysjson.push(keyjson);
				}
				catch(e) {
					console.log('could not decrypt private key for address ' + address + ' with keyuuid ' + keyuuid);
				}
				
			}
		}
		
		console.log('keysjson length is ' + keysjson.length);
		return keysjson;
	}
	
}

class CryptoKeyEncryption {
	constructor(session, cryptokey) {
		this.session = session;
		this.cryptokey = cryptokey;
	}
	
	isReady(callback) {
		var promise = new Promise(function (resolve, reject) {
			
			if (callback)
				callback(null, true);
			
			resolve(true);
		});
		
		return promise
	}
	
	getSessionObject() {
		return this.session;
	}
	
	getCryptoKeyObject() {
		return this.cryptokey;
	}
	
	// encryption
	getKeythereumClass() {
		if (typeof window !== 'undefined' && window ) {
			if (typeof window.keythereum !== 'undefined')
			return window.keythereum;
			else if (typeof window.simplestore.keythereum !== 'undefined')
					return window.simplestore.keythereum;
		}
		else if (typeof global !== 'undefined') {
			return global.simplestore.keythereum;
			//return require('keythereum');
		}
		else {
			throw 'not implemented';
		}
	}
	
	getEthereumJsClass() {
		if ( typeof window !== 'undefined' && window ) {
			if (typeof window.ethereumjs !== 'undefined')
			return window.ethereumjs;
			else if (typeof window.simplestore.ethereumjs !== 'undefined')
				return window.simplestore.ethereumjs;
		}
		else if (typeof global !== 'undefined') {
			return global.simplestore.ethereumjs;
			/*var ethereumjs;
			
			ethereumjs = require('ethereum.js');
			ethereumjs.Util = require('ethereumjs-util');
			ethereumjs.Wallet = require('ethereumjs-wallet');

			return ethereumjs;*/
		}
		else {
			throw 'not implemented';
		}
	}
	
	setPrivateKey(privkey) {
		var cryptokey = this.cryptokey;
		cryptokey.private_key = privkey;
		
		var ethereumjs = this.getEthereumJsClass();
		
		// ECE
		if (cryptokey.public_key == null) {
			//console.log('ethereumjs is ' + JSON.stringify(ethereumjs));
			
			cryptokey.public_key = '0x' + ethereumjs.Util.privateToPublic(cryptokey.private_key).toString('hex');
			
			console.log('aes public key is: ' + cryptokey.public_key );
			
			if (cryptokey.address != null) {
				// remove in session
				this.session.removeCryptoKeyObject(cryptokey);
			}
			
			cryptokey.address = '0x' + ethereumjs.Util.privateToAddress(cryptokey.private_key).toString('hex');
			
			console.log('address is: ' + cryptokey.address);
		}
		else {
			// check public key corresponds
			var public_key = '0x' + ethereumjs.Util.privateToPublic(cryptokey.private_key).toString('hex');
			
			if (public_key != cryptokey.public_key) {
				// overwrite
				cryptokey.public_key = public_key;
				
				if (cryptokey.address != null) {
					// remove in session
					this.session.removeCryptoKeyObject(cryptokey);
				}
				
				cryptokey.address = '0x' + ethereumjs.Util.privateToAddress(cryptokey.private_key).toString('hex');
			}
		}
		
		// RSA
		if (cryptokey.rsa_public_key == null) {
			cryptokey.rsa_public_key = this.getRsaPublicKeyFromPrivateKey(cryptokey.private_key);
			
			console.log('rsa public key is: ' + cryptokey.rsa_public_key );
		}
		else {
			// check rsa public key corresponds
			var rsa_public_key = this.getRsaPublicKeyFromPrivateKey(cryptokey.private_key);
			
			if (rsa_public_key != cryptokey.rsa_public_key) {
				// overwrite
				cryptokey.rsa_public_key = rsa_public_key;
				
				if (cryptokey.address != null) {
					// remove in session
					this.session.removeCryptoKeyObject(cryptokey);
				}
			}
			
		}
	}
	
	getPrivateKeyStoreFileName() {
		var ethereumjs = this.getEthereumJsClass();
		
		var cryptokey = this.cryptokey;
		var _privatekey = cryptokey.private_key;

		const wallet = ethereumjs.Wallet.fromPrivateKey(ethereumjs.Util.toBuffer(_privatekey));
		
		return wallet.getV3Filename();
	}
	
	getPrivateKeyStoreString(passphrase, callback) {
		var keythereum = this.getKeythereumClass();
		var ethereumjs = this.getEthereumJsClass();

		var cryptokey = this.cryptokey;
		var _privatekey = cryptokey.private_key;
		
		
		// store key creation
		var keystorestring;
		
		try {
			// optional private key and initialization vector sizes in bytes
			// (if params is not passed to create, keythereum.constants is used by default)
			var params = { keyBytes: 32, ivBytes: 16 };
			
			// call synchronous
			var dk = keythereum.create(params);

			dk.privateKey = ethereumjs.Util.toBuffer(_privatekey);
			
			// key export
			var kdf = "pbkdf2"; // or "scrypt" to use the scrypt kdf
			
			// Note: if options is unspecified, the values in keythereum.constants are used.
			var options = {
				kdf: kdf,
				cipher: "aes-128-ctr",
				kdfparams: {
					c: 262144,
					dklen: 32,
					prf: "hmac-sha256"
				}
			};
			
			if (callback) {
				// call asynchronous
				keythereum.dump(passphrase, dk.privateKey, dk.salt, dk.iv, options, (keyObject) => {
					keystorestring = JSON.stringify(keyObject);
					
					callback(null, keystorestring);
				});
				
				return;
			}
			else {
				// call synchronous
				var keyObject = keythereum.dump(passphrase, dk.privateKey, dk.salt, dk.iv, options);
				
				keystorestring = JSON.stringify(keyObject);
			}
		}
		catch(e) {
			console.log('exception in getPrivateKeyStoreString generating with keythereum: ' + e);
			
			if (callback) {
				callback('exception in getPrivateKeyStoreString generating with keythereum: ' + e, null);
				return;
			}
		}
		
		/*if (!keystorestring) {
			// failed to generate with keythereum (e.g. within JavaScriptCore),
			// try with ethereumjs
			try {
				const wallet = ethereumjs.Wallet.fromPrivateKey(ethereumjs.Util.toBuffer(_privatekey));
				
				//const address = wallet.getAddressString();
				//const keystoreFilename = wallet.getV3Filename();
				//const keystore = wallet.toV3(passphrase);
				keystorestring = wallet.toV3String(passphrase);
			}
			catch(e) {
				console.log('exception in getPrivateKeyStoreString generating with ethereumjs: ' + e);
			}
		}*/
		
		if (!keystorestring) {
			var error = 'could not generate a key store';
			
			throw new Error(error);
		}
		
		
		return keystorestring;		
	}
	
	readPrivateKeyFromStoreString(keystorestring, passphrase, callback) {
		if (!keystorestring) {
			if (callback)
				callback('null keystore string passed', null);
			
			return;
		}
		
		var _privatekey;
		
		var keythereum = this.getKeythereumClass();

		var keyObject = JSON.parse(keystorestring);
		
		if (callback) {
			// call asynchronous
			keythereum.recover(passphrase, keyObject, (key) => {
				if (key) {
					_privatekey = '0x' + key.toString('hex');
					
					// fill cryptokey
					var cryptokey = this.cryptokey;
					
					try {
						cryptokey.setPrivateKey(_privatekey);
						
						callback(null, cryptokey.getPrivateKey());
					}
					catch(e) {
						callback('exception in setPrivateKey: ' + e, null);
					}
				}
				else {
					callback('no private key found', null);
				}
			});
			
			return;
		}
		else {
			// call synchronous
			var key = keythereum.recover(passphrase, keyObject, (key));
			
			if (key) {
				_privatekey = '0x' + key.toString('hex');
				
				// fill cryptokey
				var cryptokey = this.cryptokey;
				cryptokey.setPrivateKey(_privatekey);
				
				return cryptokey.getPrivateKey();
			}
			else {
				return null;
			}
		}
		
	}
	

	
	setPublicKey(pubkey) {
		var cryptokey = this.cryptokey;

		if (cryptokey.private_key)
			throw 'you should not call directly setPublicKey if a private key has already been set';

		var ethereumjs = this.getEthereumJsClass();
		
		cryptokey.public_key = pubkey;
		
		if (cryptokey.address != null) {
			// remove in session
			this.session.removeCryptoKeyObject(cryptokey);
		}
		
		cryptokey.address = '0x' + ethereumjs.Util.publicToAddress(cryptokey.public_key).toString('hex');
	}
	
	// symmetric
	canDoAesEncryption() {
		if (this.cryptokey.private_key != null)
			return true;
		else
			return false;
	}
	
	canDoAesDecryption() {
		if (this.cryptokey.private_key != null)
			return true;
		else
			return false;
	}
	
	getAesCryptionParameters() {
		//var key = 'f06d69cdc7da0faffb1008270bca38f5';
		//var key = 'ae6ae8e5ccbfb04590405997ee2d52d2

		var key = this.cryptokey.private_key.substring(2, 34);
		//var rootiv = '6087dab2f9fdbbfaddc31a90ae6ae8e5ccbfb04590405997ee2d529735c1e6';
		var rootiv = '6087dab2f9fdbbfaddc31a90ae6ae8e5ccbfb04590405997ee2d529735c1e6aef54cde547';
		var iv = rootiv.substring(0,32);
		
		return {
			key: key,
			iv: iv,
			algo: 'aes-128-ctr'
		}
	}
	
	// symmetric encryption with the private key
	aesEncryptString(plaintext) {
		if (this.cryptokey.private_key == null)
			throw 'No private key set to encrypt string ' + plaintext;
		
		if (!plaintext)
			return plaintext;

		var keythereum = this.getKeythereumClass();
		
		/*console.log('typeof keythereum:',               (typeof keythereum));
		console.log('Object.keys(keythereum):',         Object.keys(keythereum));*/
		
		var cryptparams = this.getAesCryptionParameters();
		
		var key = cryptparams.key;
		var iv = cryptparams.iv; 
		var algo = cryptparams.algo;
		
		console.log('key is ' + key);
		console.log('iv is ' + iv);
		
		var plaintextbuf = keythereum.str2buf(plaintext, 'utf8');
		
		var ciphertext = '0x' + keythereum.encrypt(plaintextbuf, key, iv).toString('hex');//, algo);
		
		//console.log('plaintext input is ' + plaintext);
		//console.log('ciphertext is ' + ciphertext);
		
		var decipheredtext = this.aesDecryptString(ciphertext);
		
		//console.log('deciphered text is ' + decipheredtext);
		
		
		return ciphertext;
	}
	
	aesDecryptString(cyphertext) {
		console.log('CryptoKeyEncryption.aesDecryptString called for ' + cyphertext);
		
		if (this.cryptokey.private_key == null)
			throw 'No private key set to decrypt string ' + cyphertext;
		
		if (!cyphertext)
			return cyphertext;

		var keythereum = this.getKeythereumClass();
		
		var cryptparams = this.getAesCryptionParameters();
		
		var key = cryptparams.key;
		var iv = cryptparams.iv; 
		var algo = cryptparams.algo;
		
		var cyphertextbuf = keythereum.str2buf(cyphertext.substring(2), 'hex');
		
		var plaintext = keythereum.decrypt(cyphertextbuf, key, iv).toString('utf8');
		
		//console.log('plaintext is ' + plaintext);
		
		return plaintext;
	}
	
	// asymmetric encryption with the private/public key pair
	getBitcoreClass() {
		if ( typeof window !== 'undefined' && window ) {
			var bitcore = window.bitcore;
			
			if (bitcore)
			return bitcore;
			else {
				//throw 'window.bitcore not initialized';
				
				if (typeof window.simplestore.bitcore === 'undefined')
				window.simplestore.bitcore = bit_require('bitcore');
				
				return window.simplestore.bitcore;
			}
		}
		else if (typeof global !== 'undefined') {
			return global.simplestore.bitcore;
			//return require('bitcore');
		}
		else {
			throw 'not implemented';
		}
	}
	
	
	getBitcoreEcies() {
		if ( typeof window !== 'undefined' && window ) {
			var bitcore_ecies = window.bitcore_ecies;
			
			if (bitcore_ecies)
			return bitcore_ecies;
			else {
				//throw 'window.bitcore_ecies not initialized';

				if (typeof window.simplestore.bitcore_ecies === 'undefined')
				window.simplestore.bitcore_ecies = bit_require('bitcore_ecies');

				return window.simplestore.bitcore_ecies;
			}
		}
		else if (typeof global !== 'undefined') {
			return global.simplestore.bitcore_ecies;
			//return require('bitcore-ecies');
		}
		else {
			throw 'not implemented';
		}
	}
	
	
	canDoRsaEncryption() {
		if (this.cryptokey.rsa_public_key != null)
			return true;
		else
			return false;
	}
	
	canDoRsaDecryption() {
		if (this.cryptokey.private_key != null)
			return true;
		else
			return false;
	}
	
	getRsaWifFromPrivateKey(privatekey) {
		return privatekey.split('x')[1];
	}
	
	getRsaPublicKeyFromPrivateKey(privateKey) {
		var bitcore = this.getBitcoreClass();

		var wif_key = this.getRsaWifFromPrivateKey(privateKey);
		var privateKey = new bitcore.PrivateKey(wif_key);
		var rsa_public_key = '0x' + privateKey.toPublicKey().toString('hex');

		return rsa_public_key;
	}
	
	getRsaPublicKey(cryptokey) {
		if (!cryptokey)
			throw 'Null cryptokey passed to getRsaPublicKey';
		
		var rsaPubKey = cryptokey.getRsaPublicKey();
		
		if (rsaPubKey)
			return rsaPubKey;
		else {
			if (cryptokey.private_key) {
				// in case rsa public key has not been computed (should not happen)
				console.log('SHOULD NOT HAPPEN: no rsa public key, but cryptokey has a private key');
				var bitcore = this.getBitcoreClass();

				var cryptokeywif = this.getRsaWifFromPrivateKey(cryptokey.private_key);
				var cryptokeyPrivateKey = new bitcore.PrivateKey(cryptokeywif);
				
				return '0x' + cryptokeyPrivateKey.toPublicKey().toString('hex');
			}
			else {
				throw 'cryptokey has not private key to compute rsa public key';
			}
		}
	}
	
	rsaEncryptString(plaintext, recipientcryptokey) {
		console.log('CryptoKeyEncryption.rsaEncryptString called for ' + plaintext);
		
		var bitcore = this.getBitcoreClass();
		var ECIES = this.getBitcoreEcies();

		// sender, this cryptokey
		//var senderwif = 'Kxr9tQED9H44gCmp6HAdmemAzU3n84H3dGkuWTKvE23JgHMW8gct';
		var senderwif = this.getRsaWifFromPrivateKey(this.cryptokey.private_key);
		var senderPrivateKey = new bitcore.PrivateKey(senderwif);
		
		// recipient
		//var recipientwif = 'Kxr9tQED9H44gCmp6HAdmemAzU3n84H3dGkuWTKvE23JgHMW8gct';
		//var recipientwif = this.getRsaWifFromPrivateKey(recipientcryptokey.private_key);
		//var recipientPrivateKey = new bitcore.PrivateKey(recipientwif);
		//var recipientPublicKey = recipientPrivateKey.toPublicKey();
		var rsapubkey = this.getRsaPublicKey(recipientcryptokey);
		var recipientPublicKey = new bitcore.PublicKey(rsapubkey.substring(2));

		// encryption
		var encryptor = new ECIES()
			.privateKey(senderPrivateKey)
			.publicKey(recipientPublicKey);

		var encrypted = '0x' + encryptor.encrypt(plaintext).toString('hex');
		
		// test decrypt
		/*var decrypted = recipientcryptokey.rsaDecryptString(encrypted, this.cryptokey);
		
		console.log('plaintext is ' + plaintext);
		console.log('encrypted text is ' + encrypted);
		console.log('decrypted text is ' + decrypted);*/

		
		return encrypted;
	}
	
	rsaDecryptString(cyphertext, sendercryptokey) {
		console.log('CryptoKeyEncryption.rsaDecryptString called for ' + cyphertext);
		
		var hexcypertext = cyphertext.substring(2);
		
		if (hexcypertext.length == 0)
			return '';

		var bitcore = this.getBitcoreClass();
		var ECIES = this.getBitcoreEcies();
		var ethereumjs = this.getEthereumJsClass();
		
		// sender
		//var senderwif = 'Kxr9tQED9H44gCmp6HAdmemAzU3n84H3dGkuWTKvE23JgHMW8gct';
		//var senderwif = this.getRsaWifFromPrivateKey(sendercryptokey.private_key);
		//var senderPrivateKey = new bitcore.PrivateKey(senderwif);
		//var senderPublicKey = senderPrivateKey.toPublicKey();
		var rsapubkey = this.getRsaPublicKey(sendercryptokey);
		var senderPublicKey = new bitcore.PublicKey(rsapubkey.substring(2));
		
		// recipient, this cryptokey
		//var recipientwif = 'Kxr9tQED9H44gCmp6HAdmemAzU3n84H3dGkuWTKvE23JgHMW8gct';
		var recipientwif = this.getRsaWifFromPrivateKey(this.cryptokey.private_key);
		var recipientPrivateKey = new bitcore.PrivateKey(recipientwif);

		var decryptor = new ECIES()
			.privateKey(recipientPrivateKey)
			.publicKey(senderPublicKey);
		
		var cypherbuf = ethereumjs.Buffer.Buffer(hexcypertext, 'hex');

		var plaintext = decryptor.decrypt(cypherbuf).toString('utf8');
		
		return plaintext;
	}
	
	// signature
	signString(plaintext) {
		
		console.log('creating signature for text '+ plaintext);
		
		var ethereumjs = this.getEthereumJsClass();
		
		var cryptokey_address = this.cryptokey.getAddress();
		
		//
		// signing
		//
		

		var textHashBuffer = ethereumjs.Util.sha256(plaintext);
		var texthash = textHashBuffer.toString('hex')
		
		console.log( 'text hash is: ', texthash);

		// Util signing
		var priv_key = this.cryptokey.private_key.split('x')[1];
		var priv_key_Buffer = ethereumjs.Buffer.Buffer(priv_key, 'hex')
		var util_signature =  ethereumjs.Util.ecsign(textHashBuffer, priv_key_Buffer);
		

		console.log( 'ethereumjs.Util signature is: ', util_signature);
		
		var signature = ethereumjs.Util.toRpcSig(util_signature.v, util_signature.r, util_signature.s);
		
		console.log('signature is: ', signature);
		
		console.log('CryptoKey.validateStringSignature returns ' + this.validateStringSignature(plaintext, signature));
		
		return signature; 
	}
	
	validateStringSignature(plaintext, signature) {
		if (signature) {
			var ethereumjs = this.getEthereumJsClass();
			
			var cryptokey_address = this.cryptokey.getAddress();

			var textHashBuffer = ethereumjs.Util.sha256(plaintext);
			var texthash = textHashBuffer.toString('hex')

			var sig = ethereumjs.Util.fromRpcSig(signature);
			
			console.log('signature is: ', signature);
			console.log('sig.r sig.s sig.v ', sig.r, sig.s, sig.v);
			
			var util_pub = ethereumjs.Util.ecrecover(textHashBuffer, sig.v, sig.r, sig.s);
			var util_recoveredAddress = '0x' + ethereumjs.Util.pubToAddress(util_pub).toString('hex');
			
			return (util_recoveredAddress === cryptokey_address);
		}
		else
			return false;
	}
	
	// utils
	isValidAddress(address) {
		var ethereumjs = this.getEthereumJsClass();
		
		if (ethereumjs.Util.isValidAddress(address)){
			return true;
		}
		else {
			throw address + ' is not a valid address!';
		}
	}

	isValidPublicKey(pubkey) {
		var ethereumjs = this.getEthereumJsClass();
		
		var pubkeystr = pubkey.substring(2); // remove leading '0x'
		var pubkeybuf = ethereumjs.Buffer.Buffer(pubkeystr, 'hex'); 
		
		if (ethereumjs.Util.isValidPublic(pubkeybuf)){
			return true;
		}
		else {
			throw pubkey + ' is not a valid public key!';
		}
	}
	
	isValidPrivateKey(privkey) {
		var ethereumjs = this.getEthereumJsClass();
		
		/*console.log('typeof ethereumjs:',               (typeof ethereumjs));
		console.log('Object.keys(ethereumjs):',         Object.keys(ethereumjs));
		console.log('typeof ethereumjs.Tx:',            (typeof ethereumjs.Tx));
		console.log('typeof ethereumjs.RLP:',           (typeof ethereumjs.RLP));
		console.log('typeof ethereumjs.Util:',          (typeof ethereumjs.Util));
		console.log('typeof ethereumjs.Buffer:',        (typeof ethereumjs.Buffer));
		console.log('typeof ethereumjs.Buffer.Buffer:', (typeof ethereumjs.Buffer.Buffer));*/
		
		var privkeystr = privkey.substring(2); // remove leading '0x'
		var privkeybuf = ethereumjs.Buffer.Buffer(privkeystr, 'hex'); 
		
		if (ethereumjs.Util.isValidPrivate(privkeybuf)){
			return true;
		}
		else {
			throw privkey + ' is not a valid private key!';
		}
	}
	
	generatePrivateKey() {
		var ethereumjs = this.getEthereumJsClass();

		var cryptokeyPassword="123456";
		var key = ethereumjs.Wallet.generate(cryptokeyPassword);
		return '0x' + key._privKey.toString('hex');		
	}
	
	hash_hmac(hashforce, datastring, keystring) {
		var keythereum = this.getKeythereumClass();
		var ethereumjs = this.getEthereumJsClass();
		var bitcore = this.getBitcoreClass();
		var ECIES = this.getBitcoreEcies();
		
		
		var Hash = bitcore.crypto.Hash;
		
		var hashf = (hashforce == 'sha512' ? Hash.sha512 : Hash.sha256);
		var data = Buffer.from(datastring);
		var key = Buffer.from(keystring);
		
		var hashbuff = Hash.hmac(hashf, data, key);
		
		return hashbuff;
	}

	
}

if ( typeof window !== 'undefined' && window ) // if we are in browser and not node js (e.g. truffle)
window.simplestore.CryptoKeyEncryption = CryptoKeyEncryption;
else if (typeof global !== 'undefined')
global.simplestore.CryptoKeyEncryption = CryptoKeyEncryption; // we are in node js

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
GlobalClass.getGlobalObject().registerModuleObject(new Module());
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new Module());
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new Module());
}

