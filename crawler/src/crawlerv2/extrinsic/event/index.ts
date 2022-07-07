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


const selectEvmLogEvent = async (id: number, head: EventHead): Promise<ProcessModule> => {
  const eventData = (head.event.event.data.toJSON() as any);
  const contract = await getContractDB(toChecksumAddress(eventData[0].address));

  if (contract.length === 0)
    return new UnverifiedEvmLog(id, head);
  
  const {type, compiled_data, name} = contract[0]
  const abi = new utils.Interface(compiled_data[name]);
  const decodedEvent = abi.parseLog({ 
    topics: head.event.topics.map((t) => t.toString()), 
    data: head.event.event.data.toString()
  });

  if (decodedEvent.name === 'Transfer' && type === 'ERC20')
    return new Erc20TransferEvent(id, head, contract[0]);
  if (decodedEvent.name === 'Transfer' && type === 'ERC721')
    return new Erc721TransferEvent(id, head, contract[0]);
  if (decodedEvent.name === 'TransferSingle' && type === 'ERC1155')
    return new Erc1155SingleTransferEvent(id, head, contract[0]);
  if (decodedEvent.name === 'TransferBatch' && type === 'ERC1155')
    return new Erc1155BatchTransferEvent(id, head, contract[0]);
    
  return new EvmLogEvent(id, head, contract[0]);
}

const selectEvent = async (id: number, head: EventHead): Promise<ProcessModule> => {
  const event = head.event.event;
  const {events} = nodeProvider.getProvider().api;

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

  if (head.event.event.method === 'Log' && head.event.event.section === 'evm')
    return selectEvmLogEvent(id, head);

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
