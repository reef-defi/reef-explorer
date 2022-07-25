import logger from './logger';
import Queue from './Queue';

class Performance extends Queue<number> {
  private duration = 0;

  push(value: number) {
    this.values.push(value);
    this.duration += value;
    if (this.maxLength && this.values.length > this.maxLength) {
      this.duration -= this.pop();
    }
  }

  log() {
    if (!this.maxLength) {
      throw new Error('Max length is not defined');
    }
    logger.info(`Crawler speed: ${1000 / ((this.duration / this.values.length))} bps`);
  }
}

export default Performance;
