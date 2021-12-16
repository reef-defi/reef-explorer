import { APP_CONFIG } from "../config";

export const wait = async (ms: number): Promise<void> => 
  new Promise((res) => setTimeout(res, ms));


export const min = (...args: number[]): number => {
  if (args.length === 0) { 
    throw new Error("Given array is empty!");
  }
  return args.reduce((prev, current) => prev < current ? prev : current, args[0]);
}
export const max = (...args: number[]): number => {
  if (args.length === 0) { 
    throw new Error("Given array is empty!");
  }
  return args.reduce((prev, current) => prev > current ? prev : current, args[0]);
}

export const range = (from: number, to: number): number[] => Array(to-from)
  .fill(0)
  .map((_, index) => from + index);

  
export const compress = <T,> (values: T[][]): T[] => {
  let newValues: T[] = [];
  for (const value of values) {
    for (const innerValue of value) {
      newValues.push(innerValue)
    }
  }

  return newValues;
}
  
export const dropDuplicates = <Object, Key extends keyof Object>(objects: Object[], key: Key): Object[] => {
  const existingKeys = new Set<Object[Key]>();
  const filtered: Object[] = [];

  for (let index = objects.length - 1; index >= 0; index --) {
    const obj = objects[index];
    if (!existingKeys.has(obj[key])) {
      filtered.push(obj)
      existingKeys.add(obj[key])
    }
  }

  return filtered;
}
export const dropDuplicatesMultiKey = <Object, Key extends keyof Object>(objects: Object[], keys: Key[]): Object[] => {
  const existingKeys = new Set<string>();
  const filtered: Object[] = [];

  for (let index = objects.length - 1; index >= 0; index --) {
    const obj = objects[index];
    const ids = keys.map((key) => obj[key]).join(", ")
    if (!existingKeys.has(ids)) {
      filtered.push(obj)
      existingKeys.add(ids)
    }
  }

  return filtered;
}

export const resolvePromisesAsChunks = async <T,>(requests: Promise<T>[]): Promise<T[]> => {
  let chunks: T[] = [];
  let currentChunks: Promise<T>[] = [];

  for (let reqest of requests) {
    currentChunks.push(reqest);

    if (currentChunks.length === APP_CONFIG.chunkSize) {
      const resolvedChunk = await Promise.all(currentChunks);
      chunks.push(...resolvedChunk);
      currentChunks = [];
    }
  }

  const resolvedChunk = await Promise.all(currentChunks);
  chunks.push(...resolvedChunk);
  return chunks;
}