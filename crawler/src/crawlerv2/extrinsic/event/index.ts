import { utils } from 'ethers';
import { BytecodeLog, VerifiedContract } from '../../../crawler/types';
import { getContractDB } from '../../../queries/evmEvent';
import { toChecksumAddress } from '../../../utils/utils';
import { EventData } from '../../types';
import ClaimEvmAccountEvent from './ClaimEvmAccountEvent';
import ContractCreateEvent from './CreateContractEvent';
import DefaultEvent from './DefaultEvent';
import EndowedEvent from './EndowedEvent';
import EvmLogEvent from './EvmLogEvent';
import KillAccountEvent from './KillAccountEvent';
import ReservedEvent from './ReservedEvent';
import StakingEvent from './StakingEvent';
import Erc1155BatchTransferEvent from './transfer/Erc1155BatchTransferEvent';
import Erc1155SingleTransferEvent from './transfer/Erc1155SingleTransferEvent';
import Erc20TransferEvent from './transfer/Erc20TransferEvent';
import Erc721TransferEvent from './transfer/Erc721TransferEvent';
import NativeTransferEvent from './transfer/NativeTransferEvent';
import UnverifiedEvmLog from './UnverifiedEvmLog';
import ExecutedFailedEvent from './ExecutedFailedEvent';
import logger from '../../../utils/logger';

const resolveEvmEvent = async (head: EventData, contract: VerifiedContract): Promise<EvmLogEvent> => {
  // Decoding contract event
  const { type, compiled_data, name } = contract;
  const abi = new utils.Interface(compiled_data[name]);
  const contractData: BytecodeLog = (head.event.event.data.toJSON() as any)[0];
  const decodedEvent = abi.parseLog(contractData);
  const eventName = `${decodedEvent.name}.${type}`;

  // Handling transfer events
  switch (eventName) {
    case 'Transfer.ERC20':
      return new Erc20TransferEvent(head, contract);
    case 'Transfer.ERC721':
      return new Erc721TransferEvent(head, contract);
    case 'TransferSingle.ERC1155':
      return new Erc1155SingleTransferEvent(head, contract);
    case 'TransferBatch.ERC1155':
      return new Erc1155BatchTransferEvent(head, contract);
    default:
      return new EvmLogEvent(head, contract);
  }
};

const selectEvmLogEvent = async (head: EventData): Promise<UnverifiedEvmLog> => {
  const contractData: BytecodeLog = (head.event.event.data.toJSON() as any)[0];
  // Retrieving contract data from db
  const contract = await getContractDB(toChecksumAddress(contractData.address));

  // If contract does not exist we can not verified evm log content
  // therefore log is marked as unverified
  if (contract.length === 0) return new UnverifiedEvmLog(head);

  // If contract exists we can resolve the event and if for some reasone event cant be processed
  // return Unverified evm log
  return resolveEvmEvent(head, contract[0])
    .catch((err) => {
      logger.warn(`Error while resolving verified evm event: ${err}`);
      return new UnverifiedEvmLog(head);
    });
};

const resolveEvent = async (
  head: EventData,
): Promise<DefaultEvent> => {
  // Compressing event section and method
  const eventCompression = `${head.event.event.section.toString()}.${head.event.event.method.toString()}`;

  // Decoding native events
  switch (eventCompression) {
    case 'evm.Log': return selectEvmLogEvent(head);
    case 'evm.Created': return new ContractCreateEvent(head);
    case 'evm.ExecutedFailed': return new ExecutedFailedEvent(head);

    case 'evmAccounts.ClaimAccount': return new ClaimEvmAccountEvent(head);

    case 'balances.Endowed': return new EndowedEvent(head);
    case 'balances.Reserved': return new ReservedEvent(head);
    case 'balances.Transfer': return new NativeTransferEvent(head);

    case 'staking.Rewarded': return new StakingEvent(head);

    case 'system.KilledAccount': return new KillAccountEvent(head);

    default: return new DefaultEvent(head);
  }
};

export default resolveEvent;
