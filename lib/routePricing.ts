/** Đơn giá m³: khu vực (tuyến) ưu tiên, không có thì nhóm giá hộ. */
export function unitPriceForHousehold(household: {
  priceGroup: { unitPrice: number };
  collectionRoute?: { unitPrice: number | null } | null;
}): number {
  const routePrice = household.collectionRoute?.unitPrice;
  if (routePrice != null && routePrice > 0) return routePrice;
  return household.priceGroup.unitPrice;
}
