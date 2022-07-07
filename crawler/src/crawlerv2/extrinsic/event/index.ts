import { EventHead } from "../../../crawler/types";
import { nodeProvider } from "../../../utils/connector";
import AccountManager from "../../managers/AccountManager";
import { ProcessModule } from "../../types";
import DefaultEvent from "./DefaultEvent";
import EndowedEvent from "./EndowedEvent";
import KillAccountEvent from "./KillAccountEvent";
import NativeTransferEvent from "./NativeTransferEvent";
import ReservedEvent from "./ReservedEvent";
import StakingEvent from "./StakingEvent";


const selectEvent = (id: number, head: EventHead): ProcessModule => {
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

  return new DefaultEvent(id, head);
}

// TODO retrieve next free event id
const nextEventId = async (): Promise<number> => 10;

const resolveEvent = async (
  head: EventHead,
  accountManager: AccountManager
): Promise<ProcessModule> => {
  const id = await nextEventId();
  const event = selectEvent(id, head);

  // TODO Maybe call process outside this function
  await event.process(accountManager);
  return event;
};

export default resolveEvent;
