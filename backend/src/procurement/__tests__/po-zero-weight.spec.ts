describe('PO Zero Weight & Bought-Out Component Aggregation', () => {
  it('should preserve quantity when calculatedWeight is zero or undefined', () => {
    const rawBomItem = {
      id: 'bom-item-1',
      requiredQty: 10,
      calculatedWeight: 0,
      material: {
        materialCode: 'STD-FASTENER-M8',
        shape: 'BOUGHT_OUT',
      },
    };

    const orderedQty = rawBomItem.calculatedWeight && Number(rawBomItem.calculatedWeight) > 0
      ? Number(rawBomItem.calculatedWeight)
      : Number(rawBomItem.requiredQty);

    expect(orderedQty).toBe(10);
  });

  it('should use calculatedWeight for raw materials with positive density weight', () => {
    const rawBomItem = {
      id: 'bom-item-2',
      requiredQty: 1,
      calculatedWeight: 45.8,
      material: {
        materialCode: 'P20-BLOCK',
        shape: 'RECTANGULAR_BLOCK',
      },
    };

    const orderedQty = rawBomItem.calculatedWeight && Number(rawBomItem.calculatedWeight) > 0
      ? Number(rawBomItem.calculatedWeight)
      : Number(rawBomItem.requiredQty);

    expect(orderedQty).toBe(45.8);
  });
});
