import { utils } from 'ethers';
import BigNumber from 'bignumber.js';
import TokenPrices from '../historyModules/TokenPrices';
import { queryv2 } from '../../utils/connector';
import PoolEvent, { PoolEventData } from './PoolEvent';
import Reserves from '../historyModules/Reserves';
import Candlestick from '../historyModules/Candlestick';
import logger from '../../utils/logger';

interface PoolInfo {
  token_1: string;
  token_2: string;
  decimal_1: number;
  decimal_2: number;
}
const queryPool = async (poolId: string): Promise<PoolInfo> => queryv2<PoolInfo>('SELECT token_1, token_2, decimal_1, decimal_2 FROM pool WHERE id = $1', [poolId])
  .then((res) => res[0]);

class SyncEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, 'Sync');
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);

    const {
      token_1, token_2, decimal_1, decimal_2,
    } = await queryPool(this.poolId);

    this.reserved_1 = event.args[0].toString();
    this.reserved_2 = event.args[1].toString();

    if (!this.reserved_1 || !this.reserved_2) {
      throw new Error(`Sync event on evm event: ${this.evmEventId} has no reserve`);
    }
    logger.info(`Sync event processed! \n\tPool id:${this.poolId}\n\tReserved1: ${this.reserved_1} \n\tReserved2: ${this.reserved_2}`);

    // Update reserves for tokens in TokenPrices
    const reservedRaw1 = new BigNumber(this.reserved_1);
    const reservedRaw2 = new BigNumber(this.reserved_2);
    const reserve1 = reservedRaw1.dividedBy(10 ** decimal_1);
    const reserve2 = reservedRaw2.dividedBy(10 ** decimal_2);
    const price1 = reserve2.dividedBy(reserve1);
    const price2 = reserve1.dividedBy(reserve2);

    // Updating history modules
    TokenPrices.updateReserves(token_1, token_2, reserve1, reserve2);
    Reserves.updateReserve(this.poolId, this.evmEventId, reservedRaw1, reservedRaw2);
    Candlestick.updateCandlestick(this.poolId, token_1, price1);
    Candlestick.updateCandlestick(this.poolId, token_2, price2);
  }
}

export default SyncEvent;
