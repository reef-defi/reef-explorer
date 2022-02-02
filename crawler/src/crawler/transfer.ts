import { BigNumber } from "ethers";
import { nodeProvider } from "../utils/connector";
import { AccountHead, EvmLogWithDecodedEvent, Transfer } from "./types";

export const extractTokenTransfer = (evmLogs: EvmLogWithDecodedEvent[]): Promise<Transfer|undefined>[] => evmLogs
.map(async ({
  decodedEvent, timestamp, address, blockId, extrinsicId, signedData, contractData,
}): Promise<Transfer> => {
  const [fromEvmAddress, toEvmAddress, amount] = decodedEvent.args;
  const [fromAddressQ, toAddressQ] = await Promise.all([
    nodeProvider.query((provider) => provider.api.query.evmAccounts.accounts(fromEvmAddress)),
    nodeProvider.query((provider) => provider.api.query.evmAccounts.accounts(toEvmAddress)),
  ]);
  const toAddress = toAddressQ.toString();
  const fromAddress = fromAddressQ.toString();

  return {
    blockId,
    timestamp,
    extrinsicId,
    toEvmAddress,
    success: true,
    fromEvmAddress,
    errorMessage: '',
    tokenAddress: address,
    amount: amount.toString(),
    denom: contractData?.symbol,
    toAddress: toAddress === '' ? 'null' : toAddress,
    fromAddress: fromAddress === '' ? 'null' : fromAddress,
    feeAmount: BigNumber.from(signedData.fee.partialFee).toString(),
    type: "ERC20"
  };
});


// Assigning that the account is active is a temporary solution!
// The correct way would be to first query db if account exists
// If it does not and if transfer has failed then the account is not active.
// The query can be skipped if we would have complete
// list available in function (dynamic programming)
export const extractTransferAccounts = ({
  fromAddress,
  toAddress,
  blockId,
  timestamp,
}: Transfer): AccountHead[] => [
  {
    blockId, address: fromAddress, active: true, timestamp,
  },
  {
    blockId, address: toAddress, active: true, timestamp,
  },
];