/** Dữ liệu mẫu tiếng Việt cho seed — tách riêng để dễ chỉnh */

export const PRICE_GROUPS = [
  { code: "A", name: "Sinh hoạt", unitPrice: 15000 },
  { code: "B", name: "Kinh doanh", unitPrice: 22000 },
] as const;

export const STREETS = [
  "Lê Lợi",
  "Nguyễn Huệ",
  "Trần Hưng Đạo",
  "Phan Đình Phùng",
  "Hoàng Diệu",
  "Lý Thường Kiệt",
  "Pasteur",
  "Hai Bà Trưng",
  "Cách Mạng Tháng Tám",
  "Võ Văn Tần",
];

export const WARDS = [
  "Phường 1",
  "Phường 2",
  "Phường 3",
  "Phường 4",
  "Phường 5",
  "Phường 6",
  "Phường 7",
  "Phường 8",
];

export const DISTRICTS = [
  "Quận 1",
  "Quận 2",
  "Quận 3",
  "Quận 4",
  "Quận 5",
  "Quận 6",
  "Quận 7",
  "Quận 8",
  "Quận 9",
  "Quận 10",
  "Quận 11",
  "Quận 12",
];

const HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng"];
const DEM = [
  "Văn An",
  "Thị Mai",
  "Minh Tuấn",
  "Thu Hà",
  "Đức Anh",
  "Thanh Hương",
  "Quốc Bảo",
  "Kim Oanh",
  "Hồng Nhung",
  "Gia Bảo",
];

export function demoResidentName(): string {
  return "Nguyễn Văn An";
}

export function adminDisplayName(): string {
  return "Ban quản lý";
}

export function randomResidentName(index: number): string {
  const ho = HO[index % HO.length];
  const dem = DEM[(index * 7) % DEM.length];
  return `${ho} ${dem}`;
}

export function randomAddress(index: number): string {
  const so = (index % 120) + 1;
  const street = STREETS[index % STREETS.length];
  const ward = WARDS[index % WARDS.length];
  const district = DISTRICTS[index % DISTRICTS.length];
  return `Số ${so}, đường ${street}, ${ward}, ${district}, TP. Hồ Chí Minh`;
}
