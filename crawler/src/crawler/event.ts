import { getProvider, nodeQuery } from "../utils/connector";
import { AccountBody, AccountHead, EventHead } from "./types";

const eventToAccountHead = (
  { blockId, event, timestamp }: EventHead,
  active = true
): AccountHead[] => {
  const address = event.event.data[0].toString();
  return [{ blockId, address, active, timestamp }];
};

export const accountNewOrKilled = (eventHead: EventHead): AccountHead[] => {
  const { event, blockId, timestamp } = eventHead;
  if (getProvider().api.events.balances.Endowed.is(event.event)) {
    return eventToAccountHead(eventHead);
  } else if (getProvider().api.events.staking.Rewarded.is(event.event)) {
    return eventToAccountHead(eventHead);
  } else if (getProvider().api.events.staking.Slashed.is(event.event)) {
    return eventToAccountHead(eventHead);
  } else if (getProvider().api.events.system.KilledAccount.is(event.event)) {
    return eventToAccountHead(eventHead, false);
  } else if (getProvider().api.events.balances.Reserved.is(event.event)) {
    return eventToAccountHead(eventHead);
  } else if (getProvider().api.events.balances.Transfer.is(event.event)) {
    const res: any = event.event.data.toJSON();
    return [
      { blockId: blockId, address: res[0], active: true, timestamp },
      { blockId: blockId, address: res[1], active: true, timestamp },
    ];
  }
  return [];
};

export const accountHeadToBody = async (
  head: AccountHead
): Promise<AccountBody> => {
  const [evmAddress, balances, identity] = await Promise.all([
    nodeQuery((provider) =>
      provider.api.query.evmAccounts.evmAddresses(head.address)
    ),
    nodeQuery((provider) => provider.api.derive.balances.all(head.address)),
    nodeQuery((provider) =>
      provider.api.derive.accounts.identity(head.address)
    ),
  ]);
  const address = evmAddress.toString();

  const evmNonce: string | null =
    address !== ""
      ? await nodeQuery((provider) => provider.api.query.evm.accounts(address))
          .then((res): any => res.toJSON())
          .then((res) => res?.nonce || 0)
      : 0;

  return {
    ...head,
    evmAddress: address,
    freeBalance: balances.freeBalance.toString(),
    lockedBalance: balances.lockedBalance.toString(),
    availableBalance: balances.availableBalance.toString(),
    vestedBalance: balances.vestedBalance.toString(),
    votingBalance: balances.votingBalance.toString(),
    reservedBalance: balances.reservedBalance.toString(),
    identity: JSON.stringify(identity),
    nonce: balances.accountNonce.toString(),
    evmNonce: evmNonce,
  };
};
