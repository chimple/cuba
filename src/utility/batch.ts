export const mapInBatches = async <Input, Output>(
  items: Input[],
  batchSize: number,
  mapper: (item: Input, index: number) => Promise<Output>,
): Promise<Output[]> => {
  const resolvedItems: Output[] = [];

  for (let startIndex = 0; startIndex < items.length; startIndex += batchSize) {
    const batch = items.slice(startIndex, startIndex + batchSize);
    const resolvedBatch = await Promise.all(
      batch.map((item, batchIndex) => mapper(item, startIndex + batchIndex)),
    );

    resolvedItems.push(...resolvedBatch);
  }

  return resolvedItems;
};
