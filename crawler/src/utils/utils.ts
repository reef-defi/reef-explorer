
export const wait = async (ms: number): Promise<void> => 
  new Promise((res) => setTimeout(res, ms));


export const min = (...args: number[]): number => {
  if (args.length === 0) { 
    throw new Error("Given array is empty!");
  }
  return args.reduce((prev, current) => prev < current ? prev : current, args[0]);
}

export const range = (from: number, to: number): number[] => Array(to-from)
  .fill(0)
  .map((_, index) => from + index);

export const compress = <T,> (values: T[][]): T[] => values.reduce(
  (prev, current) => [...prev, ...current],
  [] as T[]
);
  
export const dropDuplicates = <Object, Key extends keyof Object>(objects: Object[], key: Key): Object[] => {
  const existingKeys = new Set<Object[Key]>();
  let filtered = new Array<Object>();

  for (let index = objects.length - 1; index >= 0; index --) {
    const obj = objects[index];
    if (!existingKeys.has(obj[key])) {
      filtered = [obj, ...filtered];
      existingKeys.add(obj[key])
    }
  }

  return filtered;
}