import { BigNumber, utils } from "ethers";
import { queryv2 } from "../../utils/connector";
import PoolEvent, { PoolEventData } from "./PoolEvent";

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

class TransferEvent extends PoolEvent {
  constructor(poolEvent: PoolEventData) {
    super(poolEvent, 'Transfer');
  }

  async process(event: utils.LogDescription): Promise<void> {
    await super.process(event);
    const [addr1, addr2, amount] = event.args;

    // TODO check why are this conditions needed and explain it
    // Probably because when mint is called first address is zero and 
    //  when burn is called second address is zero.
    if (addr1 !== ZERO_ADDRESS && addr2 !== ZERO_ADDRESS) { return; }
    if (addr1 === ZERO_ADDRESS && addr2 === ZERO_ADDRESS) { return; }
  
    const prevSupply = await queryv2<{total_supply: number}>(
      `SELECT total_supply
      FROM pool_event
      WHERE type = 'Transfer' AND pool_id = $1
      ORDER BY timestamp desc
      LIMIT 1;
      `,
      [this.poolId],
    );
    this.supply = (prevSupply.length > 0 && prevSupply[0].total_supply !== null ? prevSupply[0].total_supply : 0).toString();
    const isMint = addr1 === ZERO_ADDRESS;
    const prev = BigNumber.from(this.supply);
  
    this.total_supply = (isMint ? prev.add(amount) : prev.sub(amount)).toString();
  }
}

export default TransferEvent;