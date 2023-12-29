import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { parseUnits } from '@ethersproject/units';
import { getAddress } from '@zetachain/protocol-contracts';
import ERC20Custody from '@zetachain/protocol-contracts/abi/evm/ERC20Custody.sol/ERC20Custody.json';
import { prepareData } from '@zetachain/toolkit/helpers';
import { utils, ethers } from 'ethers';
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json';
import bech32 from 'bech32';
import { Contract, Wallet, providers } from 'ethers';
import { abi as swapABI } from '../artifacts/contracts/Swap.sol/Swap.json';

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
	// let swapABI =[{}]
	console.log('Starting interact task');
	/**
	 * @dev This is the private key of the account that will be used to send the transaction
	 * @provider This is the provider that will be used to send the transaction
	 */
	const privateKey = process.env.PRIVATE_KEY!;
	const provider = new ethers.providers.JsonRpcProvider(
		'https://zetachain-athens-evm.blockpi.network/v1/rpc/public'
	);
	const mumbaiProvider = new ethers.providers.JsonRpcProvider(
		'https://polygon-mumbai-bor.publicnode.com'
	);
	const signer = new ethers.Wallet(privateKey, provider);
	const mumbaiSigner = new ethers.Wallet(privateKey, mumbaiProvider);

	// Contract and Address Setup
	let swapContractAddress = '0x09B8DBfcB18Ea0DE209349dA5a903423eB13B0cA';

	const swapContract = new Contract(swapContractAddress, swapABI, provider);
	let recipient = 'tb1q8wptqjaklk7czmkgelff88zu4wz508mv76ggq3';
	try {
		if (bech32.decode(recipient)) {
			recipient = utils.solidityPack(['bytes'], [utils.toUtf8Bytes(recipient)]);
		}
	} catch (e) {
		recipient = recipient;
	}
	console.log(recipient);
	const targetToken = '0x65a45c57636f9BcCeD4fe193A602008578BcA90b';

	const data = prepareData(
		swapContractAddress,
		['address', 'bytes'],
		[targetToken, recipient]
	);

	console.log('Data with prepareData   : ', data);
	const tssAddress = '0x8531a5aB847ff5B22D855633C25ED1DA3255247e';
	console.log('TSS Address: ', tssAddress);
	const amountIn = ethers.utils.parseEther('0.02');
	console.log('Amount In: ', amountIn);
	const amountOutTx = await mumbaiSigner.sendTransaction({
		data,
		to: tssAddress,
		value: amountIn,
	});
	
	//? Hash Printing
	const receipt = await amountOutTx.wait();
	console.log('Amount Out Receipt: ', receipt.transactionHash);
	if (args.json) {
		console.log(JSON.stringify(amountOutTx, null, 2));
	} else {
		console.log(`🔑 Using account: ${signer.address}\n`);

		console.log(`🚀 Successfully broadcasted a token transfer transaction on ${hre.network.name} network.
	📝 Transaction hash: ${amountOutTx.hash}
	  `);
	}
};

task('interact', 'Interact with the contract', main)
	.addParam('name', 'The address of the withdraw contract on ZetaChain')
	.addFlag('json', 'Output in JSON');
