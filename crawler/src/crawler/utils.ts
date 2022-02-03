import { Contract } from 'ethers';
import { nodeProvider } from '../utils/connector';
import { ABI } from './types';

export const findNativeAddress = async (evmAddress: string): Promise<string> => {
  const address = await nodeProvider.query((provider) => provider.api.query.evmAccounts.accounts(evmAddress));
  return address.toString();
};

export const balanceOf = async (address: string, token: string, abi: ABI): Promise<string> => {
  const contract = new Contract(token, abi, nodeProvider.getProvider());
  const balance = await contract.balanceOf(address);
  return balance.toString();
};

export const balanceOfErc1155 = async (address: string, token: string, nft: string, abi: ABI): Promise<string> => {
  const contract = new Contract(token, abi, nodeProvider.getProvider());
  const balance = await contract.balanceOf(address, nft);
  return balance.toString();
};
