import { Contract } from '@ethersproject/contracts';
import { BigNumber } from 'ethers';
import {
  ABI, ContractResolve, ERC20Data, ERC721Data, UserTokenBalance,
} from '../../utils/types';
import { getProvider } from '../../utils/connector';
import { getAllUsersWithEvmAddress, insertTokenHolder } from '../account';

const DEFAULT_ERC20_ABI: string[] = [
  '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"}',
  '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"}',
  '{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}',
  '{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}',
];

const DEFAUTL_ERC721_ABI: string[] = [
  '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"}',
  '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"}',
  '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"}',
  '{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"}',
  '{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}',
];

const DEFAUTL_ERC1155_ABI: string[] = [
  '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"}',
  '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"indexed":false,"internalType":"uint256[]","name":"values","type":"uint256[]"}],"name":"TransferBatch","type":"event"}',
  '{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"TransferSingle","type":"event"}',
  '{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"value","type":"string"},{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"}],"name":"URI","type":"event"}',
  '{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[{"internalType":"address[]","name":"accounts","type":"address[]"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"}],"name":"balanceOfBatch","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeBatchTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}',
  '{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"}',
  '{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}',
  '{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"uri","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}',
];

const contractChecked = (abi: ABI, format: string[]): boolean => {
  const fragments = abi
    .map((fragment) => JSON.stringify(fragment));

  return format
    .reduce(
      (prev, currentFragment) => prev && fragments.includes(currentFragment),
      true,
    );
};

const checkIfContractIsERC20 = (abi: ABI): boolean => contractChecked(abi, DEFAULT_ERC20_ABI);
const checkIfContractIsERC721 = (abi: ABI): boolean => contractChecked(abi, DEFAUTL_ERC721_ABI);
const checkIfContractIsERC1155 = (abi: ABI): boolean => contractChecked(abi, DEFAUTL_ERC1155_ABI);

const extractERC20ContractData = async (address: string, abi: ABI): Promise<ERC20Data> => {
  const contract = new Contract(address, abi, getProvider());
  const [name, symbol, decimals] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals(),
  ]);

  return { name, symbol, decimals };
};

const extractERC721ContractData = async (address: string, abi: ABI): Promise<ERC721Data> => {
  const contract = new Contract(address, abi, getProvider());
  const [name, symbol] = await Promise.all([
    contract.name(),
    contract.symbol(),
  ]);

  return { name, symbol };
};

const retrieveUserTokenBalances = async (abi: ABI, address: string, decimals: number): Promise<UserTokenBalance[]> => {
  const users = await getAllUsersWithEvmAddress();
  const contract = new Contract(address, abi, getProvider());
  const balances = await Promise.all(
    users.map(async ({ evmaddress }): Promise<string> => contract.balanceOf(evmaddress)),
  );
  const accountBalances: UserTokenBalance[] = users.map((user, index) => ({
    ...user, decimals, balance: balances[index], tokenAddress: address,
  }));
  return accountBalances;
};

const resolveErc20 = async (address: string, abi: ABI): Promise<ContractResolve> => {
  const data = await extractERC20ContractData(address, abi);
  const userBalances = await retrieveUserTokenBalances(abi, address, data.decimals);
  await insertTokenHolder(
    userBalances.filter(({ balance }) => BigNumber.from(balance).gt('0')),
  );
  return { data, type: 'ERC20' };
};

const resolveErc721 = async (address: string, abi: ABI): Promise<ContractResolve> => {
  const data = await extractERC721ContractData(address, abi);
  return { data, type: 'ERC721' };
};

export default async (address: string, abi: ABI): Promise<ContractResolve> => {
  if (checkIfContractIsERC20(abi)) {
    return resolveErc20(address, abi);
  } if (checkIfContractIsERC721(abi)) {
    return resolveErc721(address, abi);
  } if (checkIfContractIsERC1155(abi)) {
    return { type: 'ERC1155', data: {} };
  }
  return { type: 'other', data: {} };
};
