
export const wait = async (ms: number): Promise<void> => 
  new Promise((res) => setTimeout(res, ms));