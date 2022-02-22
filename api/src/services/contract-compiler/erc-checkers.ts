import { Contract } from '@ethersproject/contracts';
import { BigNumber } from 'ethers';
import {
  ABI, ContractResolve, ERC20Data, ERC721Data, UserTokenBalance,
} from '../../utils/types';
import { getProvider } from '../../utils/connector';
import { getAllUsersWithEvmAddress, insertTokenHolder } from '../account';
import Erc20Abi from '../../assets/Erc20Abi';
import Erc721Abi from '../../assets/Erc721Abi';
import Erc1155Abi from '../../assets/Erc1155Abi';
import { dropKey } from '../../utils/utils';


const contractChecked = (abi: ABI, format: string[]): boolean => {
  const fragments = abi
    .map((fragment) => ({...fragment,
      inputs: fragment.inputs?.map((i) => dropKey(i, "name"))
    }))
    .map((fragment) => JSON.stringify(fragment));

  return format
    .reduce(
      (prev, currentFragment) => prev && fragments.includes(currentFragment),
      true,
    );
};

const checkIfContractIsERC20 = (abi: ABI): boolean => contractChecked(abi, Erc20Abi);
const checkIfContractIsERC721 = (abi: ABI): boolean => contractChecked(abi, Erc721Abi);
const checkIfContractIsERC1155 = (abi: ABI): boolean => contractChecked(abi, Erc1155Abi);

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
