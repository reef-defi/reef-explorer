const dot = (matrix: number[][], vector: number[]): number[] =>
  matrix.map((row) =>
    row.reduce((acc, current, index) => acc + current * vector[index], 0)
  );

export const estimateTokenPriceBasedOnReefPrice = (
  reserves: number[][],
  reefPrice: number,
  reefIndex: number
): number[] => {
  // Create new vector with reef price
  const prices = new Array(reserves.length)
    .fill(0)
    .map((_, i) => (i === reefIndex ? reefPrice : 0));

  // Solve the system of equations
  const newPrices = dot(reserves, prices);  

  // Inject reef price into the price vector
  return newPrices.map((price, index) => (index === reefIndex ? reefPrice : price));
};