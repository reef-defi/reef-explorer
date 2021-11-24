export const compress = <T,> (values: T[][]): T[] => values.reduce(
  (prev, current) => [...prev, ...current],
  [] as T[]
);
