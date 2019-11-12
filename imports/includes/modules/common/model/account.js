/**
 * 
 */
'use strict';

var AccountMap = class {
	constructor() {
		this.map = Object.create(null); // use a simple object to implement the map
	}
	
	getAccount(address) {
		var key = address.toString().trim().toLowerCase();
		
		if (key in this.map) {
			return this.map[key];
		}
	}
	
	getAccountArray() {
		var array = [];
		
		for (var key in this.map) {
		    if (!this.map[key]) continue;
		    
		    array.push(this.map[key]);
		}
		
		return array;
	}
	
	pushAccount(account) {
		var key = account.address.toString().trim().toLowerCase();

		if (!account.getPrivateKey()) {
			console.log('pushing account ' + key + ' with no private key');
			
			// we check if we have already this account
			// and check that we do not replace an object with a private key
			// with an object that does not have one
			if (key in this.map) {
				if (this.map[key].getPrivateKey())
					return;
			}
		}

		// simple replace
		this.map[key] = account;
	}
	
	removeAccount(account) {
		var key = account.address.toString().trim().toLowerCase();

		delete this.map[key];
	}
	
	count() {
		return Object.keys(this.map).length;
	}
	
	empty() {
		this.map = Object.create(null);
	}
}


var Account = class {
	constructor(session, address) {
		this.session = session;
		this.address = (address ? address.trim().toLowerCase() : address);
		
		this.description = null;
		
		this.lastunlock = null; // unix time
		this.lastunlockduration = null;
		
		this.owner = null;
		
		this.accountuuid = null;
		
		// encryption
		this.cryptokey = null;
		
		this.accountencryption = this.session.getAccountEncryptionInstance(this);
	}
	
	getUUID() {
		if (this.accountuuid)
			return this.accountuuid;
		
		this.accountuuid = this.session.getUUID();
		
		return this.accountuuid;
	}
	
	getAccountUUID() {
		return this.getUUID();
	}
	
	setAccountUUID(uuid) {
		this.accountuuid = uuid;
	}
	
	getAddress() {
		return this.address;
	}
	
	setAddress(address) {
		this.address = address;
		
		var cryptokey = this.getCryptoKey();
		
		cryptokey.setAddress(address);
	}
	
	getOwner() {
		return this.owner;
	}
	
	setOwner(user) {
		this.owner = user;
	}
	
	isValid() {
		var address = this.getAddress();
		
		if (address != null) {
			if (this.session.isValidAddress(address)) {
				return true;
			}
			else {
				return false;
			}
		}
		else {
			throw 'Account is not valid!';
		}
	}
	
	getDescription() {
		return this.description;
	}
	
	setDescription(description) {
		this.description = description;
	}
	
	getCryptoKey() {
		if (this.cryptokey)
			return this.cryptokey;
		
		var session = this.session;
		
		this.cryptokey = session.createBlankCryptoKeyObject();
		
		if (this.private_key)
			this.cryptokey.setPrivateKey(this.private_key);
		else
			this.cryptokey.setAddress(this.address);
		
		return this.cryptokey;
	}
	
	
	getPublicKey() {
		var cryptokey = this.getCryptoKey();
		
		if (cryptokey)
		return cryptokey.getPublicKey();
	}
	
	setPublicKey(pubkey) {
		var cryptokey = this.getCryptoKey();
		
		if (cryptokey)
		cryptokey.setPublicKey(pubkey);
	}
	
	isPublicKeyValid() {
		var cryptokey = this.getCryptoKey();
		
		if (cryptokey)
			return cryptokey.isPublicKeyValid()
		
		return false;
	}
	
	getPrivateKey() {
		var cryptokey = this.getCryptoKey();
		
		if (cryptokey)
			return cryptokey.getPrivateKey();
	}
	
	setPrivateKey(privkey) {
		var private_key = (privkey ? privkey.trim().toLowerCase() : privkey);
		
		try {
			var cryptokey = this.getCryptoKey();
			
			if (cryptokey) {
				cryptokey.setPrivateKey(privkey);
				this.address = cryptokey.getAddress();
			}
		}
		catch(e) {
			this.private_key = null;
		}
	}
	
	isPrivateKeyValid() {
		var cryptokey = this.getCryptoKey();
		
		if (cryptokey)
			return cryptokey.isPrivateKeyValid();
		
		return false;
	}
	
	canSignTransactions() {
		return this.isPrivateKeyValid();
	}
	
	
	// encryption
	canDoAesEncryption() {
		return this.accountencryption.canDoAesEncryption();
	}
	
	canDoAesDecryption() {
		return this.accountencryption.canDoAesDecryption();
	}
	
	getAesPublicKey() {
		return this.getPublicKey();
	}
	
	setAesPublicKey(pubkey) {
		this.setPublicKey(pubkey);
	}
	
	encryptString(plaintext) {
		if (!plaintext)
			return;
		
		return this.aesEncryptString(plaintext);
	}
	
	decryptString(ciphertext) {
		if (!ciphertext)
			return;
		
		return this.aesDecryptString(ciphertext);
	}
	
	// symmetric encryption with the private key
	aesEncryptString(plaintext) {
		if (!plaintext)
			return;
		
		return this.accountencryption.aesEncryptString(plaintext);
	}
	
	aesDecryptString(ciphertext) {
		if (!ciphertext)
			return;
		
		return this.accountencryption.aesDecryptString(ciphertext);
	}
	
	// asymmetric encryption with the private/public key pair
	canDoRsaEncryption() {
		return this.accountencryption.canDoRsaEncryption();
	}
	
	canDoRsaDecryption() {
		return this.accountencryption.canDoRsaDecryption();
	}
	
	getRsaPublicKey() {
		var cryptokey = this.getCryptoKey();
		
		if (cryptokey)
			return cryptokey.getRsaPublicKey();
	}
	
	setRsaPublicKey(pubkey) {
		var cryptokey = this.getCryptoKey();
		
		if (cryptokey)
			cryptokey.setRsaPublicKey(pubkey);
	}
	
	rsaEncryptString(plaintext, recipientaccount) {
		if (!plaintext)
			return;
		
		return this.accountencryption.rsaEncryptString(plaintext, recipientaccount);
	}
	
	rsaDecryptString(ciphertext, senderaccount) {
		if (!ciphertext)
			return;
		
		return this.accountencryption.rsaDecryptString(ciphertext, senderaccount);
	}
	
	// signature
	signString(text) {
		return this.accountencryption.signString(text);
	}
	
	validateStringSignature(text, signature) {
		return this.accountencryption.validateStringSignature(text, signature);
	}
	
	
	// static
	static getAccountObject(session, address) {
		return session.getAccountObject(address);
	}
	
}

if ( typeof GlobalClass !== 'undefined' && GlobalClass ) {
	GlobalClass.registerModuleClass('common', 'Account', Account);
	GlobalClass.registerModuleClass('common', 'AccountMap', AccountMap);
}
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('common', 'Account', Account);
	_GlobalClass.registerModuleClass('common', 'AccountMap', AccountMap);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('common', 'Account', Account);
	_GlobalClass.registerModuleClass('common', 'AccountMap', AccountMap);
}
