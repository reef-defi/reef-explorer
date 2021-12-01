import {FrameSystemEventRecord} from "@polkadot/types/lookup"
import { deactiveteAccount, insertAccount, insertEvent, signerExist } from "../queries/event";
import { nodeProvider, nodeQuery } from "../utils/connector";
import { AccountBody, AccountHead, Event, EventHead } from "./types";

export const processBlockEvent = (blockId: number, extrinsicId: number, freeEventId: number) => async (event: FrameSystemEventRecord, index: number): Promise<void> => {
  await insertEvent({
    blockId,
    extrinsicId,
    index,
    id: freeEventId + index,
    data: JSON.stringify(event.event.data.toJSON()),
    method: event.event.method,
    section: event.event.section
  });
  await resolveEvent(event, blockId);
}

const resolveEvent = async (event: FrameSystemEventRecord, blockId: number): Promise<void> => {
  if (nodeProvider.api.events.system.NewAccount.is(event.event)) {
    return await createAccount(event, blockId);
  } else if (nodeProvider.api.events.system.KilledAccount.is(event.event)) {
    return await removeAccount(event, blockId);
  } else if (nodeProvider.api.events.balances.Reserved.is(event.event)) {
    return await createAccount(event, blockId);
  } else if (nodeProvider.api.events.balances.Transfer.is(event.event)) {
    const res: any = event.event.data.toJSON();
    await checkAndCreateAccount(res[0], blockId);
    await checkAndCreateAccount(res[1], blockId);
  }
}

const removeAccount = async ({event}: FrameSystemEventRecord, blockId: number): Promise<void> => {
  const address: any = event.data.toJSON();
  const exists = await signerExist(address);
  if (!exists) { return; }
  await deactiveteAccount(address);
  console.log(`Block: ${blockId} -> Account: ${address} was marked as un-active`);
}

const createAccount = async (event: FrameSystemEventRecord, blockId: number): Promise<void> => {
  const address = event.event.data[0].toString();
  await checkAndCreateAccount(address, blockId);
}

const checkAndCreateAccount = async (address: string, blockId: number): Promise<void> => {
  const exists = await signerExist(address);
  if (exists) { return; }
  console.log(`Block: ${blockId} -> New account: ${address}`);
  const evmAddress = await nodeProvider.api.query.evmAccounts.evmAddresses(address);
  await insertAccount(address, evmAddress.toString(), blockId);
}

// New

const eventToAccountHead = ({blockId, event}: EventHead, active=true): AccountHead[] => {
  const address = event.event.data[0].toString();
  return [{blockId, address, active}];
}

export const resolveAccounts = (eventHead: EventHead): AccountHead[] => {
  const {event, blockId} = eventHead;
  if (nodeProvider.api.events.system.NewAccount.is(event.event)) {
    return eventToAccountHead(eventHead)
  } else if (nodeProvider.api.events.system.KilledAccount.is(event.event)) {
    return eventToAccountHead(eventHead, false);
  } else if (nodeProvider.api.events.balances.Reserved.is(event.event)) {
    return eventToAccountHead(eventHead);
  } else if (nodeProvider.api.events.balances.Transfer.is(event.event)) {
    const res: any = event.event.data.toJSON();
    return [
      {blockId: blockId, address: res[0], active: true},
      {blockId: blockId, address: res[1], active: true},
    ];
  }
  return [];
}

export const accountHeadToBody = async (head: AccountHead): Promise<AccountBody> => ({...head,
  evmAddress: (await nodeQuery((provider) => provider.api.query.evmAccounts.evmAddresses(head.address))).toString(),
});
