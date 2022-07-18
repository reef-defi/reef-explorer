import { EventHead } from "../../../crawler/types";
import { nodeProvider } from "../../../utils/connector";
import AccountManager from "../../managers/AccountManager";
import { ProcessModule } from "../../types";
import DefaultEvent from "./DefaultEvent";
import EndowedEvent from "./EndowedEvent";
import KillAccountEvent from "./KillAccountEvent";
import NativeTransferEvent from "./transfer/NativeTransferEvent";
import ReservedEvent from "./ReservedEvent";
import StakingEvent from "./StakingEvent";
import EvmLogEvent from "./EvmLogEvent";
import { getContractDB } from "../../../queries/evmEvent";
import { toChecksumAddress } from "../../../utils/utils";
import { utils } from "ethers";
import Erc20TransferEvent from "./transfer/Erc20TransferEvent";
import Erc721TransferEvent from "./transfer/Erc721TransferEvent";
import Erc1155SingleTransferEvent from "./transfer/Erc1155SingleTransferEvent";
import Erc1155BatchTransferEvent from "./transfer/Erc1155BatchTransferEvent";
import UnverifiedEvmLog from "./UnverifiedEvmLog";
import ClaimEvmAccountEvent from "./ClaimEvmAccountEvent";


const selectEvmLogEvent = async (id: number, head: EventHead): Promise<ProcessModule> => {
  const eventData = (head.event.event.data.toJSON() as any);
  // Retrieving contract data from db
  const contract = await getContractDB(toChecksumAddress(eventData[0].address));

  // If contract does not exist we can not verified evm log content
  // therefore log is marked as unverified
  if (contract.length === 0)
    return new UnverifiedEvmLog(id, head);
  
  // Decoding contract event
  const {type, compiled_data, name} = contract[0]
  const abi = new utils.Interface(compiled_data[name]);
  const decodedEvent = abi.parseLog({ 
    topics: head.event.topics.map((t) => t.toString()), 
    data: head.event.event.data.toString()
  });
  const eventName = `${decodedEvent.name}.${type}`;

  switch (eventName) {
    case "Transfer.ERC20":
      return new Erc20TransferEvent(id, head, contract[0]);
    case "Transfer.ERC721":
      return new Erc721TransferEvent(id, head, contract[0]);
    case "TransferSingle.ERC1155":
      return new Erc1155SingleTransferEvent(id, head, contract[0]);
    case "TransferBatch.ERC1155":
      return new Erc1155BatchTransferEvent(id, head, contract[0]);
    default:
      return new EvmLogEvent(id, head, contract[0]);
  }
}

const selectEvent = async (id: number, head: EventHead): Promise<ProcessModule> => {
  const event = head.event.event;
  const {events} = nodeProvider.getProvider().api;

  const eventCompression = `${event.section.toString()}.${event.method.toString()}`
  switch(eventCompression) {
    case 'evm.Log': return selectEvmLogEvent(id, head);
    case 'evmAccounts.Claim': return new ClaimEvmAccountEvent(id, head);
    default: return new DefaultEvent(id, head);
  }

  // Resolving native events
  if (events.staking.Rewarded.is(event)) 
    return new StakingEvent(id, head);
  if (events.system.KilledAccount.is(event)) 
    return new KillAccountEvent(id, head);
  if (events.balances.Reserved.is(event)) 
    return new ReservedEvent(id, head);
  if (events.balances.Transfer.is(event))
    return new NativeTransferEvent(id, head);
  if (events.balances.Endowed.is(event))
    return new EndowedEvent(id, head);

  // Resolving evm events
  if (head.event.event.method === 'Log' && head.event.event.section === 'evm')
    return selectEvmLogEvent(id, head);
  if (head.event.event.method === '' && head.event.event.section === '')
    return new ClaimEvmAccountEvent(id, head);


  return new DefaultEvent(id, head);
}

// TODO retrieve next free event id
const nextEventId = async (): Promise<number> => 10;

const resolveEvent = async (
  head: EventHead,
  accountManager: AccountManager
): Promise<ProcessModule> => {
  const id = await nextEventId();
  const event = await selectEvent(id, head);

  // TODO Maybe call process outside this function
  await event.process(accountManager);
  return event;
};

export default resolveEvent;
