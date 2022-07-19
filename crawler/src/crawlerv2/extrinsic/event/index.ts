import { utils } from "ethers";
import { EventHead } from "../../../crawler/types";
import { getContractDB } from "../../../queries/evmEvent";
import { toChecksumAddress } from "../../../utils/utils";
import { ProcessModule } from "../../types";
import ClaimEvmAccountEvent from "./ClaimEvmAccountEvent";
import ContractCreateEvent from "./CreateContractEvent";
import DefaultEvent from "./DefaultEvent";
import EndowedEvent from "./EndowedEvent";
import EvmLogEvent from "./EvmLogEvent";
import KillAccountEvent from "./KillAccountEvent";
import ReservedEvent from "./ReservedEvent";
import StakingEvent from "./StakingEvent";
import Erc1155BatchTransferEvent from "./transfer/Erc1155BatchTransferEvent";
import Erc1155SingleTransferEvent from "./transfer/Erc1155SingleTransferEvent";
import Erc20TransferEvent from "./transfer/Erc20TransferEvent";
import Erc721TransferEvent from "./transfer/Erc721TransferEvent";
import NativeTransferEvent from "./transfer/NativeTransferEvent";
import UnverifiedEvmLog from "./UnverifiedEvmLog";


const selectEvmLogEvent = async (head: EventHead): Promise<ProcessModule> => {
  const eventData = (head.event.event.data.toJSON() as any);
  // Retrieving contract data from db
  const contract = await getContractDB(toChecksumAddress(eventData[0].address));

  // If contract does not exist we can not verified evm log content
  // therefore log is marked as unverified
  if (contract.length === 0)
    return new UnverifiedEvmLog(head);
  
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
      return new Erc20TransferEvent(head, contract[0]);
    case "Transfer.ERC721":
      return new Erc721TransferEvent(head, contract[0]);
    case "TransferSingle.ERC1155":
      return new Erc1155SingleTransferEvent(head, contract[0]);
    case "TransferBatch.ERC1155":
      return new Erc1155BatchTransferEvent(head, contract[0]);
    default:
      return new EvmLogEvent(head, contract[0]);
  }
}

const resolveEvent = async (
  head: EventHead,
): Promise<ProcessModule> => {
  // Compressing event section and method
  const eventCompression = `${head.event.event.section.toString()}.${head.event.event.method.toString()}`

  // Decoding native events
  switch(eventCompression) {
    case 'evm.Log': return selectEvmLogEvent(head);
    case 'evm.Created': return new ContractCreateEvent(head);
    case 'evmAccounts.Claim': return new ClaimEvmAccountEvent(head);
    case 'balances.Endowed': return new EndowedEvent(head);
    case 'balances.Reserved': return new ReservedEvent(head);
    case 'balances.Transfer': return new NativeTransferEvent(head);
    case 'staking.Rewarded': return new StakingEvent(head);
    // TODO detect kill account!
    case '***': return new KillAccountEvent(head);
    default: return new DefaultEvent(head);
  }
};

export default resolveEvent;
