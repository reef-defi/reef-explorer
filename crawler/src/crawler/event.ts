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


export const accountHeadToBody = async (head: AccountHead): Promise<AccountBody> => {
  const [evmAddress, balances, identity] = await Promise.all([
    nodeQuery((provider) => provider.api.query.evmAccounts.evmAddresses(head.address)),
    nodeQuery((provider) => provider.api.derive.balances.all(head.address)),
    nodeQuery((provider) => provider.api.derive.accounts.identity(head.address))
  ])
  const address = evmAddress.toString();

  const evmNonce: string|null = address !== "" 
    ? await nodeQuery((provider) => provider.api.query.evm.accounts(address))
      .then((res): any => res.toJSON())
      .then((res) => res?.nonce || null)
    : null;

  return ({...head,
    evmAddress: address,
    freeBalance: balances.freeBalance.toString(),
    lockedBalance: balances.lockedBalance.toString(),
    availableBalance: balances.availableBalance.toString(),
    identity: identity.display ? identity.display.toString() : '',
    nonce: balances.accountNonce.toString(),
    evmNonce: evmNonce
  });
}
