export interface CityInfo {
  name: string;
  longitude: number; // độ kinh Đông
}

export interface ProvinceInfo {
  name: string;
  cities: CityInfo[];
  /** Thuộc miền Nam (từ Quảng Trị trở vào) — dùng múi giờ UTC+8 giai đoạn 1960–13/6/1975 */
  south?: boolean;
}

/** Kinh tuyến chuẩn giờ Việt Nam (UTC+7 → 105°E) */
export const VN_MERIDIAN = 105;

/**
 * Kinh tuyến chuẩn của giờ đồng hồ tại nơi sinh, theo năm sinh.
 * Miền Nam dùng giờ UTC+8 từ 1/1/1960 đến 13/6/1975 → kinh tuyến 120°.
 */
export function clockMeridian(province: string | undefined, y: number, m: number, d: number): number {
  const p = PROVINCES.find(x => x.name === province);
  if (!p?.south) return VN_MERIDIAN;
  const key = y * 10000 + m * 100 + d;
  return key >= 19600101 && key < 19750613 ? 120 : VN_MERIDIAN;
}

// 63 tỉnh/thành theo địa giới cũ (trước sáp nhập 2025) — người dùng nhập nơi sinh theo tên quen thuộc.
// Kinh độ lấy tại trung tâm tỉnh lỵ; sai số 0,1° ≈ 0,4 phút giờ Mặt Trời.
export const PROVINCES: ProvinceInfo[] = [
  { name: 'Hà Nội', cities: [
    { name: 'Nội thành Hà Nội', longitude: 105.85 }, { name: 'Đông Anh', longitude: 105.85 }, { name: 'Gia Lâm', longitude: 105.95 },
    { name: 'Hà Đông', longitude: 105.78 }, { name: 'Sơn Tây', longitude: 105.50 }, { name: 'Ba Vì', longitude: 105.42 },
  ] },
  { name: 'TP. Hồ Chí Minh', south: true, cities: [
    { name: 'Nội thành TP.HCM', longitude: 106.70 }, { name: 'Thủ Đức', longitude: 106.77 }, { name: 'Củ Chi', longitude: 106.49 },
    { name: 'Hóc Môn', longitude: 106.59 }, { name: 'Bình Chánh', longitude: 106.60 }, { name: 'Cần Giờ', longitude: 106.95 },
  ] },
  { name: 'Hải Phòng', cities: [{ name: 'Hải Phòng', longitude: 106.68 }, { name: 'Cát Hải', longitude: 107.05 }] },
  { name: 'Đà Nẵng', south: true, cities: [{ name: 'Đà Nẵng', longitude: 108.22 }] },
  { name: 'Cần Thơ', south: true, cities: [{ name: 'Cần Thơ', longitude: 105.78 }] },
  { name: 'An Giang', south: true, cities: [{ name: 'Long Xuyên', longitude: 105.43 }, { name: 'Châu Đốc', longitude: 105.12 }] },
  { name: 'Bà Rịa – Vũng Tàu', south: true, cities: [{ name: 'Vũng Tàu', longitude: 107.08 }, { name: 'Bà Rịa', longitude: 107.17 }] },
  { name: 'Bắc Giang', cities: [{ name: 'Bắc Giang', longitude: 106.20 }] },
  { name: 'Bắc Kạn', cities: [{ name: 'Bắc Kạn', longitude: 105.83 }] },
  { name: 'Bạc Liêu', south: true, cities: [{ name: 'Bạc Liêu', longitude: 105.72 }] },
  { name: 'Bắc Ninh', cities: [{ name: 'Bắc Ninh', longitude: 106.07 }] },
  { name: 'Bến Tre', south: true, cities: [{ name: 'Bến Tre', longitude: 106.38 }] },
  { name: 'Bình Định', south: true, cities: [{ name: 'Quy Nhơn', longitude: 109.22 }] },
  { name: 'Bình Dương', south: true, cities: [{ name: 'Thủ Dầu Một', longitude: 106.65 }] },
  { name: 'Bình Phước', south: true, cities: [{ name: 'Đồng Xoài', longitude: 106.90 }] },
  { name: 'Bình Thuận', south: true, cities: [{ name: 'Phan Thiết', longitude: 108.10 }] },
  { name: 'Cà Mau', south: true, cities: [{ name: 'Cà Mau', longitude: 105.15 }] },
  { name: 'Cao Bằng', cities: [{ name: 'Cao Bằng', longitude: 106.25 }] },
  { name: 'Đắk Lắk', south: true, cities: [{ name: 'Buôn Ma Thuột', longitude: 108.05 }] },
  { name: 'Đắk Nông', south: true, cities: [{ name: 'Gia Nghĩa', longitude: 107.69 }] },
  { name: 'Điện Biên', cities: [{ name: 'Điện Biên Phủ', longitude: 103.02 }] },
  { name: 'Đồng Nai', south: true, cities: [{ name: 'Biên Hòa', longitude: 106.82 }, { name: 'Long Khánh', longitude: 107.24 }] },
  { name: 'Đồng Tháp', south: true, cities: [{ name: 'Cao Lãnh', longitude: 105.63 }, { name: 'Sa Đéc', longitude: 105.76 }] },
  { name: 'Gia Lai', south: true, cities: [{ name: 'Pleiku', longitude: 108.00 }] },
  { name: 'Hà Giang', cities: [{ name: 'Hà Giang', longitude: 104.98 }] },
  { name: 'Hà Nam', cities: [{ name: 'Phủ Lý', longitude: 105.92 }] },
  { name: 'Hà Tĩnh', cities: [{ name: 'Hà Tĩnh', longitude: 105.90 }] },
  { name: 'Hải Dương', cities: [{ name: 'Hải Dương', longitude: 106.33 }] },
  { name: 'Hậu Giang', south: true, cities: [{ name: 'Vị Thanh', longitude: 105.47 }] },
  { name: 'Hòa Bình', cities: [{ name: 'Hòa Bình', longitude: 105.34 }] },
  { name: 'Hưng Yên', cities: [{ name: 'Hưng Yên', longitude: 106.05 }] },
  { name: 'Khánh Hòa', south: true, cities: [{ name: 'Nha Trang', longitude: 109.19 }, { name: 'Cam Ranh', longitude: 109.16 }] },
  { name: 'Kiên Giang', south: true, cities: [{ name: 'Rạch Giá', longitude: 105.08 }, { name: 'Phú Quốc', longitude: 103.97 }] },
  { name: 'Kon Tum', south: true, cities: [{ name: 'Kon Tum', longitude: 108.00 }] },
  { name: 'Lai Châu', cities: [{ name: 'Lai Châu', longitude: 103.46 }] },
  { name: 'Lâm Đồng', south: true, cities: [{ name: 'Đà Lạt', longitude: 108.44 }, { name: 'Bảo Lộc', longitude: 107.80 }] },
  { name: 'Lạng Sơn', cities: [{ name: 'Lạng Sơn', longitude: 106.76 }] },
  { name: 'Lào Cai', cities: [{ name: 'Lào Cai', longitude: 103.97 }, { name: 'Sa Pa', longitude: 103.84 }] },
  { name: 'Long An', south: true, cities: [{ name: 'Tân An', longitude: 106.41 }] },
  { name: 'Nam Định', cities: [{ name: 'Nam Định', longitude: 106.17 }] },
  { name: 'Nghệ An', cities: [{ name: 'Vinh', longitude: 105.68 }] },
  { name: 'Ninh Bình', cities: [{ name: 'Ninh Bình', longitude: 105.97 }] },
  { name: 'Ninh Thuận', south: true, cities: [{ name: 'Phan Rang – Tháp Chàm', longitude: 108.99 }] },
  { name: 'Phú Thọ', cities: [{ name: 'Việt Trì', longitude: 105.40 }] },
  { name: 'Phú Yên', south: true, cities: [{ name: 'Tuy Hòa', longitude: 109.30 }] },
  { name: 'Quảng Bình', cities: [{ name: 'Đồng Hới', longitude: 106.60 }] },
  { name: 'Quảng Nam', south: true, cities: [{ name: 'Tam Kỳ', longitude: 108.48 }, { name: 'Hội An', longitude: 108.33 }] },
  { name: 'Quảng Ngãi', south: true, cities: [{ name: 'Quảng Ngãi', longitude: 108.80 }] },
  { name: 'Quảng Ninh', cities: [{ name: 'Hạ Long', longitude: 107.08 }, { name: 'Móng Cái', longitude: 107.97 }] },
  { name: 'Quảng Trị', south: true, cities: [{ name: 'Đông Hà', longitude: 107.10 }] },
  { name: 'Sóc Trăng', south: true, cities: [{ name: 'Sóc Trăng', longitude: 105.97 }] },
  { name: 'Sơn La', cities: [{ name: 'Sơn La', longitude: 103.90 }] },
  { name: 'Tây Ninh', south: true, cities: [{ name: 'Tây Ninh', longitude: 106.10 }] },
  { name: 'Thái Bình', cities: [{ name: 'Thái Bình', longitude: 106.34 }] },
  { name: 'Thái Nguyên', cities: [{ name: 'Thái Nguyên', longitude: 105.84 }] },
  { name: 'Thanh Hóa', cities: [{ name: 'Thanh Hóa', longitude: 105.78 }] },
  { name: 'Thừa Thiên Huế', south: true, cities: [{ name: 'Huế', longitude: 107.59 }] },
  { name: 'Tiền Giang', south: true, cities: [{ name: 'Mỹ Tho', longitude: 106.36 }] },
  { name: 'Trà Vinh', south: true, cities: [{ name: 'Trà Vinh', longitude: 106.34 }] },
  { name: 'Tuyên Quang', cities: [{ name: 'Tuyên Quang', longitude: 105.21 }] },
  { name: 'Vĩnh Long', south: true, cities: [{ name: 'Vĩnh Long', longitude: 105.97 }] },
  { name: 'Vĩnh Phúc', cities: [{ name: 'Vĩnh Yên', longitude: 105.60 }] },
  { name: 'Yên Bái', cities: [{ name: 'Yên Bái', longitude: 104.87 }] },
];
