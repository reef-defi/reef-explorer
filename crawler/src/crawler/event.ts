import { getProvider, nodeQuery } from "../utils/connector";
import { AccountBody, AccountHead, EventHead } from "./types";

const eventToAccountHead = ({blockId, event}: EventHead, active=true): AccountHead[] => {
  const address = event.event.data[0].toString();
  return [{blockId, address, active}];
}

export const accountNewOrKilled = (eventHead: EventHead): AccountHead[] => {
  const {event, blockId} = eventHead;
  if (getProvider().api.events.balances.Endowed.is(event.event)) {
    return eventToAccountHead(eventHead);
  } else if (getProvider().api.events.system.KilledAccount.is(event.event)) {
    return eventToAccountHead(eventHead, false);
  } else if (getProvider().api.events.balances.Reserved.is(event.event)) {
    return eventToAccountHead(eventHead);
  }else if (getProvider().api.events.balances.Transfer.is(event.event)) {
    const res: any = event.event.data.toJSON();
    return [
      {blockId: blockId, address: res[0], active: true},
      {blockId: blockId, address: res[1], active: true},
    ];
  }
  return [];
}

export const extractAccounts = (eventHead: EventHead): AccountHead[] => {
  if (getProvider().api.events.system.KilledAccount.is(eventHead.event.event)) {
    return [];
  }
  console.log(eventHead);
  return [];
};


// export const resolveAccounts = (eventHead: EventHead): AccountHead[] => {
//   const {event, blockId} = eventHead;
//   if (getProvider().api.events.system.NewAccount.is(event.event)) {
//     return eventToAccountHead(eventHead)
//   } else if (getProvider().api.events.system.KilledAccount.is(event.event)) {
//     return eventToAccountHead(eventHead, false);
//   } else if (getProvider().api.events.balances.Endowed.is(event.event)) {
//     return eventToAccountHead(eventHead);
//   } else if (getProvider().api.events.balances.Transfer.is(event.event)) {
//     const res: any = event.event.data.toJSON();
//     return [
//       {blockId: blockId, address: res[0], active: true},
//       {blockId: blockId, address: res[1], active: true},
//     ];
//   }
//   return [];
// }

export const accountHeadToBody = async (head: AccountHead): Promise<AccountBody> => {
  const [evmAddress, balances] = await Promise.all([
    nodeQuery((provider) => provider.api.query.evmAccounts.evmAddresses(head.address)),
    nodeQuery((provider) => provider.api.derive.balances.all(head.address))
  ])
  return ({...head,
    evmAddress: evmAddress.toString(),
    freeBalance: balances.freeBalance.toString(),
    lockedBalance: balances.lockedBalance.toString(),
    availableBalance: balances.availableBalance.toString(),
  });
}
