import axios from "axios";

const LATES_ENDPOINT = 'https://api.coinmarketcap.com/v1/ticker/reef/';
const HISTORIC_ENDPOINT = 'https://api.coinmarketcap.com/v1/ticker/reef/historical-data/?start=20180101&end=20200101';

type HistoryData = { [date: string]: number };
type HD = [Date, Date, number];


class CoinmarketcapReefHistory {
  private history: HistoryData = {};
  private h: HD[] = [];

  async init(): Promise<void> {    
    // const response = await axios.get(CoinmarketcapReefHistory.ENDPOINT)
    // .then((res) => res)
    // .catch((err) => err);


    // Load
    this.history = {};
  }

  

  async update(): Promise<void> {
    // Load latest price
    if (this.h.length === 0) {
      throw new Error('No history');
    }
  }

  async getPrice(date: Date): Promise<number> {
    await this.update();

    let pointer = this.h[0];

    while (pointer[0] > date) {
      this.h.splice(1, 1);
      await this.update();
      pointer = this.h[0];
    }

    return pointer[2];
  }
}