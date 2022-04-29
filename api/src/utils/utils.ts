import { utils } from 'ethers';
import { Response, Request, NextFunction } from 'express';

export class StatusError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const ensure = (
  condition: boolean,
  message: string,
  status = 404,
): void => {
  if (!condition) {
    throw new StatusError(message, status);
  }
};

export const ensureObjectKeys = <Object extends {}, K extends keyof Object>(
  obj: Object,
  keys: K[],
): void => {
  keys.forEach((key) => ensure(!!obj[key], `Parameter ${key} is missing`, 400));
};

export const delay = (ms: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export const toChecksumAddress = (address: string): string => utils.getAddress(address.trim().toLowerCase());

export const dropKey = <T, Key extends keyof T>(
  obj: T,
  key: Key,
): Omit<T, Key> => {
  const newObj = { ...obj };
  delete newObj[key];
  return newObj;
};

// eslint-disable-next-line
export const asyncHandler = (fun: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction): Promise<void> => fun(req, res, next).catch(next);