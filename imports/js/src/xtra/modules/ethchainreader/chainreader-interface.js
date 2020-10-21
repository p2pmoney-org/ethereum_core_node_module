/**
 * 
 */
'use strict';

var ChainReaderInterface = class {
	constructor(session, module) {
		this.module = module
		this.global = module.global;
		
		this.session = session;
	}
	
	// api
	

	// sync
	getContract(address) {
		var Contract = this.module.getContractClass();
		
		return Contract.getContract(this.session, address);
	}
	
	// async
	getAccount(address, callback) {
		var Account = this.module.getAccountClass();
		
		return Account.getAccount(this.session, address, callback);
	}
	
	getContract(address, callback) {
		var Contract = this.module.getContractClass();
		
		return Contract.getContract(this.session, address, callback);
	}
	
	getContractName(address, callback) {
		var Contract = this.module.getContractClass();
		
		return Contract.getContractName(this.session, address, callback);
	}
	
	getContractVersion(address, callback) {
		var Contract = this.module.getContractClass();
		
		return Contract.getContractVersion(this.session, address, callback);
	}
	
	getBlock(blocknumber, callback) {
		var Block = this.module.getBlockClass();
		
		return Block.getBlock(this.session, blocknumber, callback);
	}
	
	getCurrentBlockNumber(callback) {
		var ethnode = this.module.getEthereumNodeObject(this.session);
		
		return ethnode.getHighestBlockNumber(callback);
	}
	
	getLatestBlock(callback) {
		var Block = this.module.getBlockClass();
		
		return Block.getLatestBlock(this.session, callback);
	}
	
	getTransaction(txhash, callback) {
		var Transaction = this.module.getTransactionClass();
		
		return Transaction.getTransaction(this.session, txhash, callback);
	}
	
	getLatestTransactions(callback) {
		var Block = this.module.getBlockClass();
		var self = this;
		
		return Block.getLatestBlock(this.session)
		.then(function(res) {
			var blockdata = res;

			var block = new Block(self.session, blockdata.number);
			
			block._setData(blockdata);
			
			return block.getTransactions(callback);
		});
	}
	
}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
GlobalClass.registerModuleClass('ethchainreader', 'ChainReaderInterface', ChainReaderInterface);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('ethchainreader', 'ChainReaderInterface', ChainReaderInterface);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('ethchainreader', 'ChainReaderInterface', ChainReaderInterface);
}