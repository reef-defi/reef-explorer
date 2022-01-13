import APP_CONFIG from '../config';
/* eslint no-promise-executor-return: "off" */
export const wait = async (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

export const ensure = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

export const min = (...args: number[]): number => {
  if (args.length === 0) {
    throw new Error('Given array is empty!');
  }
  return args.reduce(
    (prev, current) => (prev < current ? prev : current),
    args[0],
  );
};
export const max = (...args: number[]): number => {
  if (args.length === 0) {
    throw new Error('Given array is empty!');
  }
  return args.reduce(
    (prev, current) => (prev > current ? prev : current),
    args[0],
  );
};

export const range = (from: number, to: number): number[] => Array(to - from)
  .fill(0)
  .map((_, index) => from + index);

export const compress = <T>(values: T[][]): T[] => {
  const newValues: T[] = [];
  values.forEach((subValues) => subValues.forEach((innerValue) => newValues.push(innerValue)));

  return newValues;
};

export const dropDuplicates = <Object, Key extends keyof Object>(
  objects: Object[],
  key: Key,
): Object[] => {
  const existingKeys = new Set<Object[Key]>();
  const filtered: Object[] = [];

  for (let index = objects.length - 1; index >= 0; index -= 1) {
    const obj = objects[index];
    if (!existingKeys.has(obj[key])) {
      filtered.push(obj);
      existingKeys.add(obj[key]);
    }
  }

  return filtered;
};
export const dropDuplicatesMultiKey = <Object, Key extends keyof Object>(
  objects: Object[],
  keys: Key[],
): Object[] => {
  const existingKeys = new Set<string>();
  const filtered: Object[] = [];

  for (let index = objects.length - 1; index >= 0; index -= 1) {
    const obj = objects[index];
    const ids = keys.map((key) => obj[key]).join(', ');
    if (!existingKeys.has(ids)) {
      filtered.push(obj);
      existingKeys.add(ids);
    }
  }

  return filtered;
};

export const resolvePromisesAsChunks = async <T>(
  requests: Promise<T>[],
): Promise<T[]> => {
  const chunks: T[] = [];
  let currentChunks: Promise<T>[] = [];

  for(let index = 0; index < requests.length; index += 1) {
    currentChunks.push(requests[index]);

    if (currentChunks.length === APP_CONFIG.chunkSize) {
      const resolvedChunk = await Promise.all(currentChunks);
      chunks.push(...resolvedChunk);
      currentChunks = [];
    }
  };

  const resolvedChunk = await Promise.all(currentChunks);
  chunks.push(...resolvedChunk);
  return chunks;
};

export const removeUndefinedItem = <Type, >(item: (Type|undefined)): item is Type => item !== undefined;
