/**
 * 紫微斗数格局识别（v2 严格化版本）
 *
 * 设计原则：
 * 1. 古书条件优先：每个格局列出"必须 / 加分 / 破格"三层结构，出处可考
 * 2. 倪师立场：不使用宫干自化、大限四化、来因宫等飞星派工具
 * 3. 庙旺利陷：用 brightness 字段（bright=庙旺、normal=平、dim=陷）
 * 4. 三方四正会照：命宫 + 财帛 + 官禄 + 迁移
 * 5. 夹宫：命宫前后两宫
 *
 * 主要古籍出处：
 *  - 《紫微斗数全集》（陈抟祖师传，明代刊本）
 *  - 《紫微斗数全书》（罗洪先编，明代刊本）
 *  - 《骨髓赋》《女命骨髓赋》《十二宫诸星得地合格诀》
 *  - 倪师《天纪》紫微斗数讲义
 */

import 'server-only';
import type { ZiweiChart, Palace, Star, SiHua } from './types';

// ────────────────── 类型 ──────────────────
export interface PatternCondition {
  required: string[];   // 必须满足条件（已通过的）
  bonus?: string[];     // 加分项（已触发）
  breaking?: string[];  // 破格警示（已触发）
}

export interface Pattern {
  name: string;
  level: 'excellent' | 'good' | 'neutral' | 'caution';
  description: string;
  palaces: string[];                 // 涉及宫位
  conditions?: PatternCondition;     // 成立条件分层（v2 新增）
  source?: string;                   // 古籍出处（v2 新增）
}

// ────────────────── 常量 ──────────────────
const SHA_NAMES = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
const SHA_HARD = ['擎羊', '陀罗', '火星', '铃星'];   // 四煞
const SHA_KONG = ['地空', '地劫'];                  // 空劫
const ZUO_YOU = ['左辅', '右弼'];
const CHANG_QU = ['文昌', '文曲'];
const KUI_YUE = ['天魁', '天钺'];

// ────────────────── 辅助函数 ──────────────────
function getMajorStarNames(palace: Palace): string[] {
  return palace.stars.filter(s => s.type === 'major').map(s => s.name);
}
function findStar(palace: Palace, name: string): Star | undefined {
  return palace.stars.find(s => s.name === name);
}
function hasStar(palace: Palace, name: string): boolean {
  return palace.stars.some(s => s.name === name);
}
function findStarPalace(chart: ZiweiChart, name: string): Palace | undefined {
  return chart.palaces.find(p => p.stars.some(s => s.name === name));
}
function getPalaceByBranch(chart: ZiweiChart, branch: number): Palace | undefined {
  return chart.palaces.find(p => p.branch === ((branch % 12) + 12) % 12);
}
function shaCountInPalace(palace: Palace, list: string[] = SHA_HARD): number {
  return palace.stars.filter(s => list.includes(s.name)).length;
}
function hasShaInPalace(palace: Palace, list: string[] = SHA_NAMES): boolean {
  return palace.stars.some(s => list.includes(s.name));
}
function getSanFangPalaces(chart: ZiweiChart): Palace[] {
  const m = chart.mingGongBranch;
  const branches = [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12];
  return chart.palaces.filter(p => branches.includes(p.branch));
}
function isInSanFang(chart: ZiweiChart, branch: number): boolean {
  const m = chart.mingGongBranch;
  return [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12].includes(branch);
}
function getDuiGong(chart: ZiweiChart, branch: number): Palace | undefined {
  return getPalaceByBranch(chart, (branch + 6) % 12);
}
function getJiaPalaces(chart: ZiweiChart, branch: number): { prev?: Palace; next?: Palace } {
  return {
    prev: getPalaceByBranch(chart, (branch + 11) % 12),
    next: getPalaceByBranch(chart, (branch + 1) % 12),
  };
}
function sanFangAllStars(chart: ZiweiChart): Set<string> {
  return new Set(getSanFangPalaces(chart).flatMap(p => p.stars.map(s => s.name)));
}
function sanFangShaCount(chart: ZiweiChart, list: string[] = SHA_HARD): number {
  return getSanFangPalaces(chart).reduce((sum, p) => sum + shaCountInPalace(p, list), 0);
}
function isBright(palace: Palace, starName: string): boolean {
  const s = findStar(palace, starName);
  return s?.brightness === 'bright';
}
function isDim(palace: Palace, starName: string): boolean {
  const s = findStar(palace, starName);
  return s?.brightness === 'dim';
}
function getStarSiHua(palace: Palace, starName: string): Star['siHua'] | undefined {
  return findStar(palace, starName)?.siHua;
}
// 四化挂在星曜的 siHua 字段上，不是独立星名——不能用 hasStar / sanFangAllStars 查「化禄」
function palaceHasSiHua(palace: Palace, hua: SiHua): boolean {
  return palace.stars.some(s => s.siHua === hua);
}
function sanFangHasSiHua(chart: ZiweiChart, hua: SiHua): boolean {
  return getSanFangPalaces(chart).some(p => palaceHasSiHua(p, hua));
}
const BRANCH_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// ────────────────── 正格识别器 ──────────────────

/** 君臣庆会：紫微入命，左辅右弼同会（同宫或三方） */
function detectJunChenQingHui(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (!hasStar(ming, '紫微')) return;
  const sanFangSet = sanFangAllStars(chart);
  const hasZuo = sanFangSet.has('左辅');
  const hasYou = sanFangSet.has('右弼');
  if (!hasZuo || !hasYou) return;

  const required = ['Tử Vi nhập Mệnh', 'Tả Phù, Hữu Bật cùng hội Tam phương tứ chính'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangSet.has('文昌') || sanFangSet.has('文曲')) bonus.push('Thêm hội Văn Xương hoặc Văn Khúc');
  if (sanFangSet.has('天魁') || sanFangSet.has('天钺')) bonus.push('Khôi Việt quý nhân chiếu thêm');
  if (getStarSiHua(ming, '紫微') === '权') bonus.push('紫微化权');
  if (sanFangShaCount(chart, SHA_KONG) >= 2) breaking.push('Địa Không, Địa Kiếp giáp hoặc hội chiếu (Tử Vi kỵ Không Kiếp)');

  patterns.push({
    name: '君臣庆会',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Tử Vi nhập Mệnh, Tả Phù Hữu Bật cùng hội — đế vương được hiền thần phò tá, chủ đại phú đại quý, mệnh thống lĩnh. Cả đời quý nhân không dứt, hợp vị trí cao trong chính trường, thương trường, lãnh đạo đa lĩnh vực.',
    palaces: ['命宫'],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư · cách Quân Thần Khánh Hội»',
  });
}

/** 紫府同宫：紫微+天府于命宫（限寅、申宫） */
function detectZiFu(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const ziwei = findStarPalace(chart, '紫微');
  const tianfu = findStarPalace(chart, '天府');
  if (!ziwei || !tianfu || ziwei.branch !== tianfu.branch) return;

  const inMing = ziwei.branch === chart.mingGongBranch;
  const required = inMing
    ? ['Tử Vi, Thiên Phủ cùng nhập cung Mệnh']
    : ['Tử Vi, Thiên Phủ đồng cung (không ở Mệnh, hội chiếu giảm lực)'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  const sanFangSet = sanFangAllStars(chart);
  if (sanFangSet.has('左辅') && sanFangSet.has('右弼')) bonus.push('Tả Phù, Hữu Bật cùng hội');
  if (sanFangSet.has('文昌') || sanFangSet.has('文曲')) bonus.push('Thêm hội Xương Khúc');
  if (hasShaInPalace(ziwei, SHA_KONG)) breaking.push('Cung Tử Phủ có Không Kiếp (phá quý khí Tử Phủ)');
  if (shaCountInPalace(ziwei, SHA_HARD) >= 2) breaking.push('Cung Tử Phủ có hai sát tinh cùng tọa');

  patterns.push({
    name: '紫府同宫',
    level: inMing && !breaking.length ? 'excellent' : 'good',
    description: inMing
      ? 'Tử Vi, Thiên Phủ cùng nhập Mệnh, đế tướng cùng đến, mệnh tôn quý. Chủ phẩm hạnh đoan chính, cơm áo không lo, có tài lãnh đạo, hợp giữ chức vụ quan trọng. Cần Tả Hữu phò tá mới thành đại cách trọn vẹn.'
      : 'Tử Vi, Thiên Phủ đồng cung nhưng không tọa Mệnh: cả đời có quý nhân, quý khí nâng đỡ, nhưng bản thân chưa chắc đại phú quý, còn tùy cát sát hội chiếu.',
    palaces: [ziwei.name],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư · cách Tử Phủ đồng cung»',
  });
}

/** 府相朝垣：天府、天相分别坐守命宫的三方四正 */
function detectFuXiangChaoYuan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const tianfu = findStarPalace(chart, '天府');
  const tianxiang = findStarPalace(chart, '天相');
  if (!tianfu || !tianxiang) return;
  if (!isInSanFang(chart, tianfu.branch) || !isInSanFang(chart, tianxiang.branch)) return;
  if (tianfu.branch === chart.mingGongBranch && tianxiang.branch === chart.mingGongBranch) return;
  if (tianfu.branch === tianxiang.branch) return;

  const required = ['Thiên Phủ ở Tam phương cung Mệnh', 'Thiên Tướng ở Tam phương cung Mệnh', 'Hai sao không đồng cung'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (hasStar(ming, '禄存') || palaceHasSiHua(ming, '禄')) bonus.push('Cung Mệnh gặp Lộc');
  if (sanFangAllStars(chart).has('左辅')) bonus.push('Thêm hội Tả Phù');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('Cung Mệnh có sát tinh');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('Tam phương tứ chính quá nhiều sát tinh');

  patterns.push({
    name: '府相朝垣',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Thiên Phủ, Thiên Tướng chia giữ Tam phương tứ chính cung Mệnh, văn võ kiêm toàn, quyền ấn song huy, chủ cả đời cơm áo đầy đủ, địa vị cao. Cổ thư nói "Phủ Tướng triều viên, nghìn chung thực lộc", thường gặp ở người làm chính trường, quản lý doanh nghiệp.',
    palaces: [tianfu.name, tianxiang.name],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư · cách Phủ Tướng Triều Viên»',
  });
}

/** 阳梁昌禄：太阳+天梁+文昌+禄存四星会命宫，大贵格 */
function detectYangLiangChangLu(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('太阳') || !sanFangSet.has('天梁') ||
      !sanFangSet.has('文昌') || !sanFangSet.has('禄存')) return;

  const sun = findStarPalace(chart, '太阳')!;
  const liang = findStarPalace(chart, '天梁')!;
  const required = [
    'Thái Dương hội Tam phương cung Mệnh',
    'Thiên Lương hội Tam phương cung Mệnh',
    'Văn Xương hội Tam phương cung Mệnh',
    'Lộc Tồn hội Tam phương cung Mệnh',
  ];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (isBright(sun, '太阳')) bonus.push('太阳庙旺');
  if (isBright(liang, '天梁')) bonus.push('天梁庙旺');
  if (sanFangHasSiHua(chart, '科')) bonus.push('Thêm hội Hóa Khoa');
  if (isDim(sun, '太阳')) breaking.push('Thái Dương hãm địa (Dương Lương mất sáng)');
  if (sanFangShaCount(chart, SHA_HARD) >= 2) breaking.push('Tam phương sát nặng');

  patterns.push({
    name: '阳梁昌禄',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Thái Dương, Thiên Lương, Văn Xương, Lộc Tồn bốn sao cùng hội Tam phương cung Mệnh, được gọi là "sao khoa cử", chủ thanh quý hiển đạt, vận thi cử rất tốt, hợp học thuật, giáo dục, nghiên cứu, chứng chỉ chuyên môn; cả đời công danh dễ thành.',
    palaces: [sun.name, liang.name],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư · cách Dương Lương Xương Lộc»',
  });
}

/** 火贪格 / 铃贪格：贪狼+火星 或 贪狼+铃星 同宫或会照 */
function detectHuoTanLingTan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const tan = findStarPalace(chart, '贪狼');
  if (!tan) return;
  const huo = findStarPalace(chart, '火星');
  const ling = findStarPalace(chart, '铃星');

  for (const [shaName, shaPalace] of [['火星', huo], ['铃星', ling]] as const) {
    if (!shaPalace) continue;
    const sameOrTrine =
      tan.branch === shaPalace.branch ||
      (tan.branch + 4) % 12 === shaPalace.branch ||
      (tan.branch + 8) % 12 === shaPalace.branch ||
      (tan.branch + 6) % 12 === shaPalace.branch;
    if (!sameOrTrine) continue;
    if (!isInSanFang(chart, tan.branch)) continue;

    const required = [`贪狼${tan.branch === shaPalace.branch ? 'đồng cung' : 'hội chiếu'}${shaName}`, 'Tham Lang hội chiếu Tam phương cung Mệnh'];
    const bonus: string[] = [];
    const breaking: string[] = [];
    if (isBright(tan, '贪狼')) bonus.push('贪狼庙旺');
    if (getStarSiHua(tan, '贪狼') === '禄' || getStarSiHua(tan, '贪狼') === '权') bonus.push('贪狼化禄/化权');
    if (hasShaInPalace(tan, ['擎羊', '陀罗'])) breaking.push('Cung Tham Lang lại gặp Dương Đà (phá lực hoạnh phát)');
    if (hasShaInPalace(tan, SHA_KONG)) breaking.push('Tham Lang gặp Không Kiếp (tiền đến tiền đi)');

    patterns.push({
      name: shaName === '火星' ? '火贪格' : '铃贪格',
      level: breaking.length ? 'good' : 'excellent',
      description: `Tham Lang gặp ${shaName}${tan.branch === shaPalace.branch ? 'đồng cung' : ' hội chiếu Tam phương'} , chủ bất ngờ được của, cơ hội đến đột ngột. Cổ thư nói “Tham Lang gặp Hỏa Linh ắt phát hoạnh tài”, nhưng đến nhanh đi cũng nhanh, nên biết điểm dừng. ${breaking.length ? ' Lá số này đã chạm điều kiện phá cách, lực phát giảm.' : ''}`,
      palaces: [tan.name, shaPalace.name],
      conditions: { required, bonus, breaking },
      source: '«Tử Vi Đẩu Số Cốt Tủy Phú»',
    });
  }
}

/** 武贪格：武曲+贪狼 同宫（丑、未） 或 对照 */
function detectWuTan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const wu = findStarPalace(chart, '武曲');
  const tan = findStarPalace(chart, '贪狼');
  if (!wu || !tan) return;
  const sameOrOppose = wu.branch === tan.branch || (wu.branch + 6) % 12 === tan.branch;
  if (!sameOrOppose) return;
  if (!isInSanFang(chart, wu.branch) && !isInSanFang(chart, tan.branch)) return;

  const required = [
    wu.branch === tan.branch ? 'Vũ Khúc, Tham Lang đồng cung (Sửu/未）' : 'Vũ Khúc, Tham Lang xung chiếu từ cung đối',
    'Hội chiếu Tam phương cung Mệnh',
  ];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('火星') || sanFangAllStars(chart).has('铃星'))
    bonus.push('Thêm gặp Hỏa Tinh/Linh Tinh (Hỏa Tham/Linh Tham chồng nhau)');
  if (getStarSiHua(wu, '武曲') === '禄') bonus.push('武曲化禄');
  if (hasShaInPalace(wu, ['擎羊', '陀罗'])) breaking.push('Cung Vũ Tham gặp Dương Đà');
  if (hasShaInPalace(wu, SHA_KONG)) breaking.push('Cung Vũ Tham gặp Không Kiếp');

  patterns.push({
    name: '武贪格',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Vũ Khúc, Tham Lang hội Mệnh, tài tinh và sao đào hoa dục vọng cùng tỏa sáng. Cổ thư nói "Vũ Tham không phát thời niên thiếu" — sau 30 tuổi mới tích lũy dày mà phát. Chủ từ trung niên đại phú đại quý, nguồn tiền từ quan hệ, giao tế, quản trị dục vọng; hợp tài chính, đầu cơ, bán hàng, giải trí.',
    palaces: [wu.name, tan.name],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Cốt Tủy Phú»',
  });
}

/** 杀破狼：七杀、破军、贪狼三方齐聚 */
function detectShaPoLang(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['七杀', '破军', '贪狼'].filter(s => sanFangSet.has(s));
  if (has.length < 3) return;

  const required = ['Thất Sát, Phá Quân, Tham Lang ba sao cùng nhập Tam phương tứ chính cung Mệnh'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangHasSiHua(chart, '禄') || sanFangHasSiHua(chart, '权')) bonus.push('Tam phương có Hóa Lộc hoặc Hóa Quyền (động mà có lực)');
  if (sanFangSet.has('左辅') && sanFangSet.has('右弼')) bonus.push('Phụ Bật cùng hội (trong biến động gặp quý nhân)');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('Sát tinh quá nặng (động mà không thành)');
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('Mệnh có Không Kiếp (động mà vất vả)');

  patterns.push({
    name: '杀破狼',
    level: breaking.length ? 'caution' : 'good',
    description: 'Thất Sát, Phá Quân, Tham Lang hội Mệnh, mệnh cách khai sáng xông pha. Đời nhiều biến động, không cam bình thường; hợp khởi nghiệp, quân đội – công an, kinh doanh, bán hàng. Sau trung niên mới ổn định thủ thành, thời trẻ dễ thất bại vì bốc đồng.',
    palaces: getSanFangPalaces(chart).filter(p => has.includes(getMajorStarNames(p)[0])).map(p => p.name),
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư · Sát Phá Tham»',
  });
}

/** 机月同梁：天机、太阴、天同、天梁四星齐入命迁财官 */
function detectJiYueTongLiang(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['天机', '太阴', '天同', '天梁'].filter(s => sanFangSet.has(s));
  if (has.length < 4) return;

  const required = ['Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương bốn sao cùng nhập Tam phương tứ chính cung Mệnh'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangSet.has('文昌') || sanFangSet.has('文曲')) bonus.push('Thêm hội Xương Khúc');
  if (sanFangHasSiHua(chart, '科')) bonus.push('Thêm hội Hóa Khoa');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('Quá nhiều sát tinh (Cơ Nguyệt Đồng Lương kỵ sát)');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('Cung Mệnh có sát tinh');

  patterns.push({
    name: '机月同梁',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương cùng nhập Mệnh – Di – Tài – Quan: nho nhã, thông minh giỏi mưu tính. Hợp nhất công chức, học thuật, văn nghệ, y tế, dịch vụ — những ngành cần tích lũy ổn định; không nên mạo hiểm, đầu cơ lớn.',
    palaces: getSanFangPalaces(chart).filter(p => has.some(s => getMajorStarNames(p).includes(s))).map(p => p.name),
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư · cách Cơ Nguyệt Đồng Lương»',
  });
}

/** 廉贞天相：同宫 */
function detectLianXiang(chart: ZiweiChart, patterns: Pattern[]) {
  const lian = findStarPalace(chart, '廉贞');
  const xiang = findStarPalace(chart, '天相');
  if (!lian || !xiang || lian.branch !== xiang.branch) return;

  const inMing = lian.branch === chart.mingGongBranch;
  const required = ['Liêm Trinh, Thiên Tướng đồng cung'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (hasStar(lian, '禄存') || getStarSiHua(lian, '廉贞') === '禄') bonus.push('Gặp Lộc Tồn hoặc Liêm Trinh Hóa Lộc');
  if (sanFangAllStars(chart).has('左辅')) bonus.push('Tả Phù hội chiếu');
  if (hasShaInPalace(lian, ['擎羊'])) breaking.push('Cung Liêm Tướng có Kình Dương (xu hướng Liêm Sát Dương)');
  if (getStarSiHua(lian, '廉贞') === '忌') breaking.push('廉贞化忌');

  patterns.push({
    name: '廉贞天相格',
    level: breaking.length ? 'caution' : (inMing ? 'good' : 'neutral'),
    description: 'Liêm Trinh, Thiên Tướng đồng cung, cách ấn thụ, chủ làm việc công tâm, tiếng thanh liêm; hợp công chức, quản lý hành chính, pháp chế, kế hoạch. Sợ gặp Kình Dương, Hóa Kỵ thì ngược lại chủ kiện tụng.',
    palaces: [lian.name],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư»',
  });
}

/** 武曲七杀：同宫，将星配财星 */
function detectWuQiSha(chart: ZiweiChart, patterns: Pattern[]) {
  const wu = findStarPalace(chart, '武曲');
  const qi = findStarPalace(chart, '七杀');
  if (!wu || !qi || wu.branch !== qi.branch) return;

  const inMing = wu.branch === chart.mingGongBranch;
  const required = ['Vũ Khúc, Thất Sát đồng cung'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (getStarSiHua(wu, '武曲') === '权') bonus.push('武曲化权');
  if (getStarSiHua(wu, '武曲') === '禄') bonus.push('武曲化禄');
  if (getStarSiHua(wu, '武曲') === '忌') breaking.push('Vũ Khúc Hóa Kỵ (điềm kiếp tài)');
  if (hasShaInPalace(wu, ['擎羊', '陀罗', '火星', '铃星'])) breaking.push('Cung Vũ Sát quá nhiều sát tinh');

  patterns.push({
    name: '武曲七杀',
    level: breaking.length ? 'caution' : (inMing ? 'excellent' : 'good'),
    description: 'Vũ Khúc, Thất Sát đồng cung, tướng tinh đi cùng tài tinh, chủ quả quyết cương nghị, giỏi quản lý tiền; hợp tài chính, quân đội – công an, khởi nghiệp. Kỵ gặp Hóa Kỵ và sát tinh, nếu không thì hung hiểm. Cả đời phấn đấu, tích được của nhưng nhiều lo toan.',
    palaces: [wu.name],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư»',
  });
}

/** 天同天梁：同宫 */
function detectTongLiang(chart: ZiweiChart, patterns: Pattern[]) {
  const tong = findStarPalace(chart, '天同');
  const liang = findStarPalace(chart, '天梁');
  if (!tong || !liang || tong.branch !== liang.branch) return;

  const required = ['Thiên Đồng, Thiên Lương đồng cung'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('文昌')) bonus.push('Văn Xương hội chiếu');
  if (getStarSiHua(tong, '天同') === '禄') bonus.push('天同化禄');
  if (hasShaInPalace(tong, SHA_HARD)) breaking.push('Sát tinh cùng tọa');

  patterns.push({
    name: '天同天梁格',
    level: breaking.length ? 'neutral' : 'good',
    description: 'Thiên Đồng, Thiên Lương đồng cung, phúc tinh và ấm tinh cùng hội, chủ khoan hậu hiền hòa, thích giúp người; hợp y tế, giáo dục, tôn giáo, công ích xã hội. Nhưng thiên ôn hòa thận trọng, khó thành cục đại phú đại quý.',
    palaces: [tong.name],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư»',
  });
}

/** 日月同宫：太阳太阴丑或未宫同宫 */
function detectRiYueTongGong(chart: ZiweiChart, patterns: Pattern[]) {
  const sun = findStarPalace(chart, '太阳');
  const moon = findStarPalace(chart, '太阴');
  if (!sun || !moon || sun.branch !== moon.branch) return;
  if (sun.branch !== 1 && sun.branch !== 7) return;  // 必须丑(1) 或 未(7)

  const inMing = sun.branch === chart.mingGongBranch;
  const required = [`Thái Dương, Thái Âm cùng nhập ${BRANCH_NAMES[sun.branch]}宫`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sun.branch === 7) bonus.push('Nhật Nguyệt đồng huy ở cung Mùi (cổ thư: Nhật Nguyệt ở Mùi song mỹ)');
  if (sanFangAllStars(chart).has('文昌') && sanFangAllStars(chart).has('文曲')) bonus.push('Xương Khúc hội chiếu');
  if (hasShaInPalace(sun, SHA_HARD)) breaking.push('Cung Nhật Nguyệt có sát tinh cùng tọa');

  patterns.push({
    name: '日月同宫',
    level: breaking.length ? 'good' : (inMing ? 'excellent' : 'good'),
    description: `Thái Dương, Thái Âm đồng cung tại cung ${BRANCH_NAMES[sun.branch]} , âm dương cân bằng, văn võ kiêm toàn. Chủ duyên khác giới tốt, sự nghiệp thuận lợi, danh tiếng vang xa. ${sun.branch === 7 ? ' Nhật Nguyệt ở Mùi song mỹ càng đẹp.' : ' Nhật Nguyệt đồng cung ở Sửu lực khá bình.'}`,
    palaces: [sun.name],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư»',
  });
}

/** 日月夹命：太阳太阴在命宫前后两宫 */
function detectRiYueJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasSun = hasStar(prev, '太阳');
  const prevHasMoon = hasStar(prev, '太阴');
  const nextHasSun = hasStar(next, '太阳');
  const nextHasMoon = hasStar(next, '太阴');
  const ok = (prevHasSun && nextHasMoon) || (prevHasMoon && nextHasSun);
  if (!ok) return;

  const sunPalace = prevHasSun ? prev : next;
  const moonPalace = prevHasMoon ? prev : next;
  const required = ['Thái Dương, Thái Âm ở hai cung kẹp cung Mệnh'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (isBright(sunPalace, '太阳')) bonus.push('太阳庙旺');
  if (isBright(moonPalace, '太阴')) bonus.push('太阴庙旺');
  if (isDim(sunPalace, '太阳') || isDim(moonPalace, '太阴')) breaking.push('Nhật Nguyệt hãm địa (giáp Mệnh mà không sáng)');

  patterns.push({
    name: '日月夹命',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Thái Dương, Thái Âm ở hai bên giáp chiếu cung Mệnh, quang minh lỗi lạc, cả đời có quý nhân giúp, sự nghiệp phát triển. Nam chủ quan quý, nữ chủ vượng phu hưng gia. Nhật Nguyệt phải không hãm mới là giáp thật.',
    palaces: [sunPalace.name, moonPalace.name],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư · Nhật Nguyệt giáp Mệnh»',
  });
}

/** 巨日同宫：巨门太阳同入寅或申 */
function detectJuRiTongGong(chart: ZiweiChart, patterns: Pattern[]) {
  const ju = findStarPalace(chart, '巨门');
  const sun = findStarPalace(chart, '太阳');
  if (!ju || !sun || ju.branch !== sun.branch) return;
  if (ju.branch !== 2 && ju.branch !== 8) return;  // 必须寅(2) 或 申(8)

  const inMing = ju.branch === chart.mingGongBranch;
  const required = [`Cự Môn, Thái Dương cùng nhập ${BRANCH_NAMES[ju.branch]}宫`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (ju.branch === 2) bonus.push('Ở Dần Thái Dương Miếu Vượng, Cự Môn được ánh dương hóa giải thị phi');
  if (getStarSiHua(ju, '巨门') === '禄' || getStarSiHua(ju, '巨门') === '权') bonus.push('巨门化禄/Hóa Quyền (khẩu tài sinh tiền)');
  if (getStarSiHua(ju, '巨门') === '忌') breaking.push('Cự Môn Hóa Kỵ (khẩu thiệt kiện tụng)');
  if (ju.branch === 8) breaking.push('Ở Thân Thái Dương đã ngả tây, ám diệu Cự Môn càng rõ');

  patterns.push({
    name: '巨日同宫',
    level: breaking.length ? 'caution' : (inMing && ju.branch === 2 ? 'excellent' : 'good'),
    description: `Cự Môn, Thái Dương đồng cung tại cung ${BRANCH_NAMES[ju.branch]} , Thái Dương hóa giải ám diệu của Cự Môn, chủ lập nghiệp bằng khẩu tài, truyền thông, ngoại ngữ, chuyên môn. Ở Dần là đẹp, ở Thân giảm lực. Sợ Cự Môn Hóa Kỵ thì kiện tụng.`,
    palaces: [ju.name],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư · Cự Nhật đồng cung»',
  });
}

/** 石中隐玉：巨门入命于子午宫 */
function detectShiZhongYinYu(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (!hasStar(ming, '巨门')) return;
  if (ming.branch !== 0 && ming.branch !== 6) return;  // 子(0) 或 午(6)

  const required = [`Cự Môn nhập Mệnh tại ${BRANCH_NAMES[ming.branch]}宫`];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (getStarSiHua(ming, '巨门') === '禄' || getStarSiHua(ming, '巨门') === '权') bonus.push('巨门化禄/化权');
  if (sanFangAllStars(chart).has('文昌')) bonus.push('Văn Xương hội chiếu (ngọc trong đá được sáng)');
  if (getStarSiHua(ming, '巨门') === '忌') breaking.push('Cự Môn Hóa Kỵ (ngọc vùi bùn sâu)');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('Mệnh có sát tinh');

  patterns.push({
    name: '石中隐玉',
    level: breaking.length ? 'caution' : 'excellent',
    description: 'Cự Môn tọa Mệnh ở Tý Ngọ, bề ngoài bình thường mà bên trong ẩn tài học. Thời trẻ âm thầm, trung niên mới lộ quý khí; hợp chuyên môn, nghiên cứu, khẩu tài, truyền thông. Cần Lộc Quyền hoặc Văn Xương trợ giúp mới "đục đá thấy ngọc"。',
    palaces: ['命宫'],
    conditions: { required, bonus, breaking },
    source: '«Cốt Tủy Phú · Thạch Trung Ẩn Ngọc»',
  });
}

/** 明珠出海：命宫在未空宫，对宫丑宫为太阳太阴 */
function detectMingZhuChuHai(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (ming.branch !== 7) return;   // 命在未
  if (getMajorStarNames(ming).length > 0) return;   // 命宫为空宫
  const dui = getDuiGong(chart, ming.branch);
  if (!dui) return;
  if (!hasStar(dui, '太阳') || !hasStar(dui, '太阴')) return;

  const required = ['Cung Mệnh ở Mùi, vô chính diệu', 'Cung đối ở Sửu có Thái Dương, Thái Âm đồng độ'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('文昌') || sanFangAllStars(chart).has('文曲')) bonus.push('Thêm hội Xương Khúc');
  if (sanFangAllStars(chart).has('左辅') || sanFangAllStars(chart).has('右弼')) bonus.push('Phụ Bật trợ giúp');
  if (sanFangShaCount(chart, SHA_HARD) >= 2) breaking.push('Sát tinh hội chiếu (ánh ngọc mờ nhạt)');

  patterns.push({
    name: '明珠出海',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Mệnh ở Mùi vô chính diệu, cung đối Sửu có Nhật Nguyệt đồng huy chiếu về, gọi là "明珠出海". Chủ xuất thân bình thường, nhờ nỗ lực mà vươn lên; hợp đi xa lập nghiệp, nghiên cứu học thuật hoặc vị trí cao ở công ty lớn, chủ đại phú đại quý.',
    palaces: ['命宫', dui.name],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Tập · Minh Châu Xuất Hải»',
  });
}

/** 紫微独坐入命 */
function detectZiWeiInMing(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (!hasStar(ming, '紫微') || hasStar(ming, '天府')) return;

  const required = ['Tử Vi độc tọa cung Mệnh (không có Thiên Phủ)'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  const sanFangSet = sanFangAllStars(chart);
  if (sanFangSet.has('左辅') && sanFangSet.has('右弼')) bonus.push('Tả Phù, Hữu Bật cùng hội');
  if (sanFangSet.has('文昌') && sanFangSet.has('文曲')) bonus.push('Văn Xương, Văn Khúc cùng hội');
  if (!sanFangSet.has('左辅') && !sanFangSet.has('右弼')) breaking.push('Không có Phụ Bật (cô quân không thần)');
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('Tử Vi gặp Không Kiếp (cổ thư kỵ nhất)');

  patterns.push({
    name: 'Tử Vi nhập Mệnh',
    level: breaking.length ? 'caution' : (bonus.length ? 'excellent' : 'good'),
    description: 'Tử Vi độc tọa cung Mệnh, sao đế vương, tự trọng cao, có sức hút lãnh đạo. Nhưng Tử Vi kỵ nhất "cô quân tại dã" — nếu không có Tả Hữu phò tá thì thành cô cao tự ngạo, dễ chuốc lời gièm pha.',
    palaces: ['命宫'],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư»',
  });
}

/** 辅弼夹命 */
function detectFuBiJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasZuo = hasStar(prev, '左辅');
  const prevHasYou = hasStar(prev, '右弼');
  const nextHasZuo = hasStar(next, '左辅');
  const nextHasYou = hasStar(next, '右弼');
  if (!((prevHasZuo && nextHasYou) || (prevHasYou && nextHasZuo))) return;

  const required = ['Tả Phù, Hữu Bật ở hai cung kẹp cung Mệnh'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('天魁') || sanFangAllStars(chart).has('天钺')) bonus.push('Thêm hội Khôi Việt');

  patterns.push({
    name: '辅弼夹命',
    level: 'excellent',
    description: 'Tả Phù, Hữu Bật giáp Mệnh; truyền thống cho rằng cách này tượng trưng quý nhân giúp đỡ và phúc dày. Hợp con đường quan chức, quản lý doanh nghiệp lớn — nơi phát huy tài tổ chức. Cổ thư nói "Tả Phù Hữu Bật, trọn đời phúc dày" — nhấn mạnh ưu thế tổ chức, điều phối của cách này.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required, bonus, breaking },
    source: '«Tử Vi Đẩu Số Toàn Thư · Phụ Bật giáp Mệnh»',
  });
}

/** 昌曲夹命 */
function detectChangQuJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const prevHasChang = hasStar(prev, '文昌');
  const prevHasQu = hasStar(prev, '文曲');
  const nextHasChang = hasStar(next, '文昌');
  const nextHasQu = hasStar(next, '文曲');
  if (!((prevHasChang && nextHasQu) || (prevHasQu && nextHasChang))) return;

  patterns.push({
    name: '昌曲夹命',
    level: 'excellent',
    description: 'Văn Xương, Văn Khúc giáp cung Mệnh, chủ thông minh tuấn tú, văn chương rực rỡ; hợp giáo dục, học thuật, nghệ thuật, viết lách. Cổ thư nói "Xương Khúc giáp Mệnh chủ khoa giáp", rất lợi thi cử.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required: ['Văn Xương, Văn Khúc ở hai cung kẹp cung Mệnh'] },
    source: '«Tử Vi Đẩu Số Toàn Thư»',
  });
}

/** 魁钺夹命 */
function detectKuiYueJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, '天魁') && hasStar(next, '天钺');
  const okB = hasStar(prev, '天钺') && hasStar(next, '天魁');
  if (!okA && !okB) return;

  patterns.push({
    name: '魁钺夹命',
    level: 'good',
    description: 'Thiên Khôi, Thiên Việt giáp Mệnh — dương là Thiên Ất, âm là Ngọc Đường — cả đời có quý nhân nâng đỡ. Thi cử, xin việc, lúc then chốt thường có quý nhân bất ngờ giúp đỡ.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required: ['Thiên Khôi, Thiên Việt ở hai cung kẹp cung Mệnh'] },
    source: '«Tử Vi Đẩu Số Toàn Thư»',
  });
}

/** 双禄朝垣：化禄 + 禄存 同会三方 */
function detectShuangLuChaoYuan(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFang = getSanFangPalaces(chart);
  let huaLuFound = false;
  let luCunFound = false;
  for (const p of sanFang) {
    if (p.stars.some(s => s.siHua === '禄')) huaLuFound = true;
    if (hasStar(p, '禄存')) luCunFound = true;
  }
  if (!huaLuFound || !luCunFound) return;

  patterns.push({
    name: '双禄朝垣',
    level: 'excellent',
    description: 'Hóa Lộc, Lộc Tồn cùng hội Tam phương tứ chính cung Mệnh, nguồn tiền dồi dào, cơm áo đầy đủ. Cổ thư nói "Song Lộc triều viên, giàu sánh Đào Chu", chủ cả đời không lo tiền, thường có cả chính tài lẫn hoạnh tài.',
    palaces: sanFang.map(p => p.name),
    conditions: {
      required: ['Hóa Lộc hội chiếu Tam phương tứ chính', 'Lộc Tồn hội chiếu Tam phương tứ chính'],
      breaking: hasShaInPalace(ming, SHA_KONG) ? ['Mệnh có Không Kiếp (song Lộc gặp Không, tiền đến tiền đi)'] : undefined,
    },
    source: '«Tử Vi Đẩu Số Toàn Thư · Song Lộc Triều Viên»',
  });
}

/** 三奇加会：化禄 化权 化科 同会三方 */
function detectSanQiJiaHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangPalaces = getSanFangPalaces(chart);
  let lu = false, quan = false, ke = false;
  for (const p of sanFangPalaces) {
    for (const s of p.stars) {
      if (s.siHua === '禄') lu = true;
      if (s.siHua === '权') quan = true;
      if (s.siHua === '科') ke = true;
    }
  }
  if (!(lu && quan && ke)) return;

  patterns.push({
    name: '三奇加会',
    level: 'excellent',
    description: 'Hóa Lộc, Hóa Quyền, Hóa Khoa ba cát hóa cùng hội Tam phương tứ chính cung Mệnh, được gọi là "三奇加会". Chủ cả đời công danh, tài phú, quý nhân đều đủ — một trong những cát cách cao nhất của Tử Vi Đẩu Số.',
    palaces: sanFangPalaces.map(p => p.name),
    conditions: { required: ['Hóa Lộc, Hóa Quyền, Hóa Khoa cùng hội Tam phương tứ chính cung Mệnh'] },
    source: '«Tử Vi Đẩu Số Toàn Thư · Tam Kỳ Gia Hội»',
  });
}

/** 化禄入命/官/财 */
function detectHuaLuRuMing(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const huaLuStar = ming.stars.find(s => s.siHua === '禄' && s.type === 'major');
  if (!huaLuStar) return;

  patterns.push({
    name: `${huaLuStar.name} Hóa Lộc nhập Mệnh`,
    level: 'good',
    description: `${huaLuStar.name} Hóa Lộc tọa Mệnh, chủ kiếm tiền thuận lợi, nhân duyên tốt, nhiều cơ hội. ${huaLuStar.name === '武曲' ? ' Vũ Khúc Hóa Lộc thuộc chính tài, hợp thực nghiệp, tài chính.' : huaLuStar.name === '太阴' ? ' Thái Âm Hóa Lộc thuộc âm tài, bất động sản.' : huaLuStar.name === '贪狼' ? ' Tham Lang Hóa Lộc thuộc tiền từ quan hệ, tiền đào hoa.' : ''}`,
    palaces: ['命宫'],
    conditions: { required: [`${huaLuStar.name} Hóa Lộc tọa cung Mệnh`] },
    source: '«Tử Vi Đẩu Số Toàn Thư»',
  });
}

// ────────────────── 恶格识别器 ──────────────────

/** 化忌入命/迁 */
function detectHuaJiRuMingQian(chart: ZiweiChart, patterns: Pattern[]) {
  const qianBranch = (chart.mingGongBranch + 6) % 12;
  for (const palace of chart.palaces) {
    if (palace.branch !== chart.mingGongBranch && palace.branch !== qianBranch) continue;
    const jiStar = palace.stars.find(s => s.siHua === '忌' && s.type === 'major');
    if (!jiStar) continue;

    const inMing = palace.branch === chart.mingGongBranch;
    patterns.push({
      name: `${jiStar.name} Hóa Kỵ nhập ${inMing ? '命' : 'Thiên Di'}`,
      level: 'caution',
      description: inMing
        ? `${jiStar.name} Hóa Kỵ tọa cung Mệnh, cần để ý sự cố chấp, vướng mắc tâm lý hoặc nguy cơ sức khỏe; mọi việc nên lùi một bước mà nghĩ. Hóa Kỵ chưa chắc xấu, chỉ là năng lượng sao này cần được đặc biệt chú ý.`
        : `${jiStar.name} Hóa Kỵ tọa cung Thiên Di, đi xa, giao tiếp dễ có trắc trở, nên giữ không nên động.`,
      palaces: [palace.name],
      conditions: { required: [`${jiStar.name} Hóa Kỵ tọa ${inMing ? '命' : 'Thiên Di'}宫`] },
      source: '«Tử Vi Đẩu Số Toàn Thư»',
    });
  }
}

/** 羊陀夹忌：化忌坐宫，左右被擎羊陀罗夹 */
function detectYangTuoJiaJi(chart: ZiweiChart, patterns: Pattern[]) {
  for (const palace of chart.palaces) {
    const jiStar = palace.stars.find(s => s.siHua === '忌');
    if (!jiStar) continue;
    if (palace.branch !== chart.mingGongBranch) continue;   // 只看命宫被夹

    const { prev, next } = getJiaPalaces(chart, palace.branch);
    if (!prev || !next) continue;
    const aPrev = hasStar(prev, '擎羊') && hasStar(next, '陀罗');
    const aNext = hasStar(prev, '陀罗') && hasStar(next, '擎羊');
    if (!aPrev && !aNext) continue;

    patterns.push({
      name: '羊陀夹忌',
      level: 'caution',
      description: 'Hóa Kỵ tọa Mệnh, hai bên Kình Dương, Đà La giáp Mệnh. Cổ thư nói "Dương Đà giáp Kỵ là bại cục", chủ cả đời bôn ba vất vả, lận đận, thân tâm mỏi mệt. Cần lấy tu dưỡng đức hạnh và làm việc tích cực để hóa giải, mọi việc lấy cẩn trọng làm đầu.',
      palaces: ['命宫', prev.name, next.name],
      conditions: { required: ['Hóa Kỵ tọa Mệnh', 'Kình Dương, Đà La ở hai cung kẹp cung Mệnh'] },
      source: '«Cốt Tủy Phú · Dương Đà giáp Kỵ»',
    });
    return;
  }
}

/** 火铃夹命：火星铃星分居命宫前后 */
function detectHuoLingJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, '火星') && hasStar(next, '铃星');
  const okB = hasStar(prev, '铃星') && hasStar(next, '火星');
  if (!okA && !okB) return;

  patterns.push({
    name: '火铃夹命',
    level: 'caution',
    description: 'Hỏa Tinh, Linh Tinh ở hai cung kẹp cung Mệnh, chủ tính nóng, dễ bốc đồng, dễ gặp sự cố hoặc tranh chấp bất ngờ. Cần rèn tính kiên nhẫn, tránh quyết định bốc đồng.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required: ['Hỏa Tinh, Linh Tinh ở hai cung kẹp cung Mệnh'] },
    source: '«Tử Vi Đẩu Số Toàn Thư»',
  });
}

/** 空劫夹命：地空地劫分居命宫前后 */
function detectKongJieJiaMing(chart: ZiweiChart, patterns: Pattern[]) {
  const { prev, next } = getJiaPalaces(chart, chart.mingGongBranch);
  if (!prev || !next) return;
  const okA = hasStar(prev, '地空') && hasStar(next, '地劫');
  const okB = hasStar(prev, '地劫') && hasStar(next, '地空');
  if (!okA && !okB) return;

  patterns.push({
    name: '空劫夹命',
    level: 'caution',
    description: 'Địa Không, Địa Kiếp giáp Mệnh, chủ tiền đến tiền đi, tư tưởng thoát tục, dễ đi vào tôn giáo, triết học. Cổ thư nói "Không Kiếp giáp Mệnh, tiền không tụ". Hợp nghề kỹ nghệ, tôn giáo, nghiên cứu — những việc không nặng vật chất.',
    palaces: ['命宫', prev.name, next.name],
    conditions: { required: ['Địa Không, Địa Kiếp ở hai cung kẹp cung Mệnh'] },
    source: '«Tử Vi Đẩu Số Toàn Thư»',
  });
}

/** 廉杀羊：廉贞、七杀、擎羊三星会照（流年大限最凶） */
function detectLianShaYang(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has('廉贞') && sanFangSet.has('七杀') && sanFangSet.has('擎羊'))) return;

  patterns.push({
    name: '廉杀羊',
    level: 'caution',
    description: 'Liêm Trinh, Thất Sát, Kình Dương ba sao hội chiếu Tam phương cung Mệnh — truyền thống xếp vào tổ hợp cần đặc biệt lưu ý. Khi Đại Hạn, Lưu Niên kích hoạt, nên giữ thái độ cẩn trọng: an toàn khi lái xe, hòa khí với người, quyết định y tế cần lý trí — nhấn mạnh chủ động quản lý chứ không phó mặc số phận.',
    palaces: ['命宫'],
    conditions: { required: ['Liêm Trinh, Thất Sát, Kình Dương hội chiếu Tam phương tứ chính'] },
    source: '«Tử Vi Đẩu Số Toàn Thư · Liêm Sát Dương»',
  });
}

/** 巨火羊：巨门、火星、擎羊会照 */
function detectJuHuoYang(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has('巨门') && sanFangSet.has('火星') && sanFangSet.has('擎羊'))) return;

  patterns.push({
    name: '巨火羊',
    level: 'caution',
    description: 'Cự Môn, Hỏa Tinh, Kình Dương ba sao hội chiếu; cổ thư ghi đây là tổ hợp cần cảnh giác (cổ văn nói "chung thân ải tử" là cách nói định mệnh luận, nay không còn phù hợp). Cách hiểu hiện đại: tổ hợp này tượng trưng nói thẳng dễ gây xung đột, khi cảm xúc mạnh cần tự nhận biết. Hướng tu dưỡng: tập diễn đạt ôn hòa, chủ động hóa giải đối lập, rèn quản lý cảm xúc.',
    palaces: ['命宫'],
    conditions: { required: ['Cự Môn, Hỏa Tinh, Kình Dương hội chiếu Tam phương tứ chính'] },
    source: '«Cốt Tủy Phú · Cự Hỏa Dương»',
  });
}

/** 铃昌陀武：铃星、文昌、陀罗、武曲会照（限至投河） */
function detectLingChangTuoWu(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!(sanFangSet.has('铃星') && sanFangSet.has('文昌') && sanFangSet.has('陀罗') && sanFangSet.has('武曲'))) return;

  patterns.push({
    name: '铃昌陀武',
    level: 'caution',
    description: 'Linh Tinh, Văn Xương, Đà La, Vũ Khúc bốn sao cùng hội; cổ thư ghi đây là tổ hợp cần đặc biệt lưu ý (cổ văn nói "hạn chí đầu hà" là cách nói định mệnh luận, không phải cách hiểu hiện đại). Lời khuyên hiện đại: khi Đại Hạn, Lưu Niên kích hoạt, nên xử lý quyết định lớn một cách lý trí, để ý dao động cảm xúc, giữ cuộc sống ổn định — nhấn mạnh chủ động quản lý chứ không thụ động chờ đợi.',
    palaces: ['命宫'],
    conditions: { required: ['Linh Tinh, Văn Xương, Đà La, Vũ Khúc hội chiếu Tam phương tứ chính'] },
    source: '«Cốt Tủy Phú · Linh Xương Đà Vũ»',
  });
}

/** 马头带箭：擎羊在午宫坐命 */
function detectMaTouDaiJian(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  if (ming.branch !== 6) return;   // 必须午
  if (!hasStar(ming, '擎羊')) return;

  const required = ['Kình Dương tọa Mệnh tại Ngọ'];
  const bonus: string[] = [];
  const breaking: string[] = [];
  if (sanFangAllStars(chart).has('七杀') || sanFangAllStars(chart).has('破军')) bonus.push('Thêm hội Thất Sát hoặc Phá Quân (võ chức đại quý)');
  if (sanFangAllStars(chart).has('天魁') || sanFangAllStars(chart).has('天钺')) bonus.push('Khôi Việt chiếu thêm');

  patterns.push({
    name: '马头带箭',
    level: bonus.length ? 'good' : 'caution',
    description: 'Kình Dương tọa Mệnh tại Ngọ, gọi là "马头带箭", cổ thư nói "uy trấn biên cương". Cách này tượng trưng hành động quả quyết và tinh thần cạnh tranh, hợp nghề cần năng lực thực thi và quyết đoán. Truyền thống cũng nhắc cách này cần cát tinh phối hợp mới phát huy tốt nhất — nhấn mạnh ảnh hưởng tổ hợp chứ không luận một sao riêng lẻ.',
    palaces: ['命宫'],
    conditions: { required, bonus },
    source: '«Cốt Tủy Phú · Mã Đầu Đới Tiễn»',
  });
}

// ────────────────── 基础格局（提升识别覆盖率）──────────────────
// 设计：让普通命盘也能识别出 1-3 个常见格局，而不是 30+ 严格古书格局都不匹配。
// 这些都是单一条件触发的轻量识别，level 多为 neutral / good。

/** 禄存守身：禄存入身宫（或命宫与身宫同宫） */
function detectLuCunShouShen(chart: ZiweiChart, patterns: Pattern[]) {
  const luCunPalace = findStarPalace(chart, '禄存');
  if (!luCunPalace) return;
  const inMing = luCunPalace.branch === chart.mingGongBranch;
  const inShen = luCunPalace.branch === chart.shenGongBranch;
  if (!inMing && !inShen) return;
  patterns.push({
    name: inMing ? '禄存守命' : '禄存守身',
    level: 'good',
    description: inMing
      ? 'Lộc Tồn tọa Mệnh, chủ cả đời cơm áo không lo, tài lộc ổn định. Tính thận trọng, giỏi tích lũy, nhưng Dương Đà giáp Lộc phải phòng tiểu nhân. Có thêm Hóa Lộc, Tả Phù Hữu Bật mới thành đại cách.'
      : 'Lộc Tồn nhập cung Thân, chủ sau trung niên nguồn tiền ổn định, có lộc tự hưởng. Thầy Nghê nói “Lộc Tồn nhập Thân, tài khí gần thân” — bạn đời hoặc hướng sự nghiệp mang lại tài lộc ổn định.',
    palaces: [inMing ? '命宫' : '身宫'],
    conditions: { required: [inMing ? 'Lộc Tồn nhập cung Mệnh' : 'Lộc Tồn nhập cung Thân'] },
    source: '«Tử Vi Đẩu Số Toàn Thư · sao Lộc Tồn»',
  });
}

/** 天马入命/迁：驿马星动 */
function detectTianMaRuMing(chart: ZiweiChart, patterns: Pattern[]) {
  const tianMaPalace = findStarPalace(chart, '天马');
  if (!tianMaPalace) return;
  const inMing = tianMaPalace.branch === chart.mingGongBranch;
  const inQian = tianMaPalace.branch === ((chart.mingGongBranch + 6) % 12);
  if (!inMing && !inQian) return;
  patterns.push({
    name: inMing ? '天马入命' : '天马在迁',
    level: 'neutral',
    description: inMing
      ? 'Thiên Mã tọa Mệnh, chủ cả đời bôn ba, trong động có tiền; hợp buôn bán đi xa, công việc bên ngoài, phát triển đa lĩnh vực. Thầy Nghê nói “Thiên Mã nhập Mệnh, không Lộc không phát” — nếu thêm Lộc Tồn hoặc Hóa Lộc thành cách giàu “Lộc Mã giao trì”.'
      : 'Thiên Mã ở cung Thiên Di, chủ đi xa có lợi, xa quê có tiền, hợp phát triển nơi đất khách. Có Hóa Lộc chủ sinh tài ở xứ người, có sát tinh thì đường xa nhiều trắc trở.',
    palaces: [tianMaPalace.name],
    conditions: { required: [inMing ? 'Thiên Mã nhập cung Mệnh' : 'Thiên Mã nhập cung Thiên Di'] },
    source: '«Tử Vi Đẩu Số Toàn Thư · sao Thiên Mã»',
  });
}

/** 化禄入财：财帛宫主星化禄 */
function detectHuaLuRuCai(chart: ZiweiChart, patterns: Pattern[]) {
  const cai = chart.palaces.find(p => p.name === '财帛');
  if (!cai) return;
  const luStar = cai.stars.find(s => s.type === 'major' && s.siHua === '禄');
  if (!luStar) return;
  patterns.push({
    name: '化禄入财',
    level: 'good',
    description: `${luStar.name} Hóa Lộc nhập cung Tài Bạch, chủ nguồn tiền thông suốt, thu nhập ổn định. Thầy Nghê giảng Hóa Lộc là biểu tượng “chính tài” — năng lực mà sao Hóa Lộc này đại diện (đặc tính cốt lõi của ${luStar.name} ) là trục chính để bạn kiếm tiền. Có thêm Lộc Tồn hoặc Thiên Mã thì nguồn tiền càng rộng.`,
    palaces: ['财帛'],
    conditions: { required: [`${luStar.name} Hóa Lộc nhập cung Tài Bạch`] },
    source: '«Tử Vi Đẩu Số Toàn Thư · Tứ Hóa luận»',
  });
}

/** 化权入官：官禄宫主星化权 */
function detectHuaQuanRuGuan(chart: ZiweiChart, patterns: Pattern[]) {
  const guan = chart.palaces.find(p => p.name === '官禄');
  if (!guan) return;
  const quanStar = guan.stars.find(s => s.type === 'major' && s.siHua === '权');
  if (!quanStar) return;
  patterns.push({
    name: '化权入官',
    level: 'good',
    description: `${quanStar.name} Hóa Quyền nhập cung Quan Lộc, chủ sự nghiệp có sức kiểm soát, gánh được vị trí độc lập một mảng. Hóa Quyền đại diện quyền lực và năng lực thực thi — ${quanStar.name} Hóa Quyền cho thấy bạn có thể là người ra quyết định hoặc thực thi cốt lõi, hợp con đường quản lý hoặc chuyên gia kỹ thuật.`,
    palaces: ['官禄'],
    conditions: { required: [`${quanStar.name} Hóa Quyền nhập cung Quan Lộc`] },
    source: '«Tử Vi Đẩu Số Toàn Thư · Tứ Hóa luận»',
  });
}

/** 化科入命/身：科名加身 */
function detectHuaKeRuMingShen(chart: ZiweiChart, patterns: Pattern[]) {
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  const shen = chart.palaces.find(p => p.branch === chart.shenGongBranch);
  const target = [ming, shen].filter((p): p is Palace => Boolean(p));
  for (const p of target) {
    const keStar = p.stars.find(s => s.type === 'major' && s.siHua === '科');
    if (!keStar) continue;
    const isMing = p.branch === chart.mingGongBranch;
    patterns.push({
      name: isMing ? '化科入命' : '化科入身',
      level: 'good',
      description: `${keStar.name} Hóa Khoa nhập cung ${isMing ? '命' : '身'} , chủ danh tiếng, giấy tờ, vận học thuật. Thầy Nghê giảng Hóa Khoa là “sao quý nhân” — ${keStar.name} Hóa Khoa mang lại phẩm chất được người coi trọng, hợp văn thư, giáo dục, nghiên cứu, tư vấn, sáng tạo nội dung — hướng “lấy danh cầu lợi”.`,
      palaces: [isMing ? '命宫' : '身宫'],
      conditions: { required: [`${keStar.name} Hóa Khoa nhập cung ${isMing ? '命' : '身'}宫`] },
      source: '«Tử Vi Đẩu Số Toàn Thư · Tứ Hóa luận»',
    });
    return; // 命和身重复时只识别一次
  }
}

/** 机月同梁三星会（3 星不全格，非四星真格）：天机/太阴/天同/天梁 任 3 星齐入三方四正 */
function detectJiYueTongLiangPartial(chart: ZiweiChart, ming: Palace, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['天机', '太阴', '天同', '天梁'].filter(s => sanFangSet.has(s));
  if (has.length !== 3) return; // 4 星齐由 detectJiYueTongLiang 处理
  // 避免和上面 detectJiYueTongLiang 重复（4 星齐的不进这里）
  const missing = ['天机', '太阴', '天同', '天梁'].filter(s => !sanFangSet.has(s));
  patterns.push({
    name: '机月同梁三星会',
    level: 'neutral',
    description: `Cơ Nguyệt Đồng Lương cần đủ bốn sao Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương hội Tam phương tứ chính mới là chân cách; lá số này chỉ hội 3 sao ( ${has.join('、')} ), thiếu ${missing.join('、')} , nên chưa phải chân cách, lực giảm một bậc. Nho nhã có mưu, hợp công chức, giảng dạy – nghiên cứu, y tế, dịch vụ — ngành dựa vào tích lũy và ổn định; mấu chốt là sao còn thiếu và Tứ Hóa phối hợp ra sao.`,
    palaces: getSanFangPalaces(chart).filter(p => has.some(s => getMajorStarNames(p).includes(s))).map(p => p.name),
    conditions: { required: [`Tam phương tứ chính hội ${has.join('、')} (Cơ Nguyệt Đồng Lương thiếu ${missing.join('、')}）`] },
    source: '«Tử Vi Đẩu Số Toàn Thư · cách Cơ Nguyệt Đồng Lương»',
  });
  void ming;
}

/** 昌曲同会：文昌+文曲都在命三方四正 */
function detectChangQuTongHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('文昌') || !sanFangSet.has('文曲')) return;
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  if (!ming) return;
  const inMing = hasStar(ming, '文昌') && hasStar(ming, '文曲');
  patterns.push({
    name: inMing ? '昌曲坐命' : '昌曲同会',
    level: 'good',
    description: inMing
      ? 'Văn Xương, Văn Khúc cùng nhập cung Mệnh, chủ thông minh tuấn tú, văn chương rực rỡ; hợp văn học, giáo dục, viết lách, tư vấn. Kỵ nhất Hóa Kỵ — Xương Khúc Hóa Kỵ chủ thiệt thòi ngầm về giấy tờ hợp đồng.'
      : 'Văn Xương, Văn Khúc cùng hội Tam phương tứ chính, chủ tài hoa tràn đầy, nói hay viết giỏi. Hợp ngành cần diễn đạt và văn chương; có Hóa Khoa hỗ trợ thì danh tiếng rõ rệt.',
    palaces: ['命宫'],
    conditions: { required: ['Văn Xương, Văn Khúc cùng hội Tam phương tứ chính cung Mệnh'] },
    source: '«Tử Vi Đẩu Số Toàn Thư · Văn tinh luận»',
  });
}

/** 辅弼同会：左辅+右弼都在命三方四正 */
function detectFuBiTongHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('左辅') || !sanFangSet.has('右弼')) return;
  patterns.push({
    name: '辅弼同会',
    level: 'good',
    description: 'Tả Phù, Hữu Bật cùng hội Tam phương tứ chính cung Mệnh, chủ cả đời quý nhân không dứt, nhân duyên rất tốt. Hợp nhất vị trí lãnh đạo và công việc làm nhóm. Thầy Nghê nói “Phụ Bật giáp Mệnh, cả đời nhiều quý nhân” — bạn không phải mệnh đơn thương độc mã, hãy tận dụng mạng lưới quan hệ.',
    palaces: ['命宫'],
    conditions: { required: ['Tả Phù, Hữu Bật cùng hội Tam phương tứ chính cung Mệnh'] },
    source: '«Tử Vi Đẩu Số Toàn Thư · Phụ Bật luận»',
  });
}

/** 魁钺同会：天魁+天钺都在命三方四正 */
function detectKuiYueTongHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('天魁') || !sanFangSet.has('天钺')) return;
  patterns.push({
    name: '魁钺同会',
    level: 'good',
    description: 'Thiên Khôi, Thiên Việt cùng hội Tam phương tứ chính cung Mệnh, chủ có "Thiên Ất quý nhân" hỗ trợ, lúc then chốt luôn có quý nhân nâng đỡ. Thầy Nghê nói “Khôi Việt giáp Mệnh, ắt là quý nhân” — khi khó khăn sẽ có người đắc lực giúp đỡ, nên chủ động giữ gìn quan hệ.',
    palaces: ['命宫'],
    conditions: { required: ['Thiên Khôi, Thiên Việt cùng hội Tam phương tứ chính cung Mệnh'] },
    source: '«Tử Vi Đẩu Số Toàn Thư · Khôi Việt luận»',
  });
}

/** 科权双会：化科 + 化权 同会三方四正 */
function detectKeQuanShuangHui(chart: ZiweiChart, patterns: Pattern[]) {
  const sfPalaces = getSanFangPalaces(chart);
  let hasKe = false, hasQuan = false;
  for (const p of sfPalaces) {
    for (const s of p.stars) {
      if (s.type === 'major' && s.siHua === '科') hasKe = true;
      if (s.type === 'major' && s.siHua === '权') hasQuan = true;
    }
  }
  if (!hasKe || !hasQuan) return;
  patterns.push({
    name: '科权双会',
    level: 'good',
    description: '化科 +  Hóa Quyền cùng hội Tam phương tứ chính, chủ danh quyền song mỹ — vừa có học thức, /danh tiếng (Khoa), vừa có sức kiểm soát (Quyền); hợp con đường "chuyên gia đầu ngành" (bác sĩ, luật sư, giáo sư, kỹ thuật chủ chốt), danh lợi song thu, nền tảng vững chắc.',
    palaces: ['命宫'],
    conditions: { required: ['Hóa Khoa, Hóa Quyền cùng hội Tam phương tứ chính cung Mệnh'] },
    source: '«Tử Vi Đẩu Số Toàn Thư · Tứ Hóa hội chiếu»',
  });
}

// ────────────────── 主入口 ──────────────────
export function detectPatterns(chart: ZiweiChart): Pattern[] {
  const patterns: Pattern[] = [];
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  if (!ming) return patterns;

  // 上格
  detectJunChenQingHui(chart, ming, patterns);
  detectZiFu(chart, ming, patterns);
  detectFuXiangChaoYuan(chart, ming, patterns);
  detectYangLiangChangLu(chart, ming, patterns);
  detectHuoTanLingTan(chart, ming, patterns);
  detectWuTan(chart, ming, patterns);
  detectShaPoLang(chart, ming, patterns);
  detectJiYueTongLiang(chart, ming, patterns);

  // 中格
  detectLianXiang(chart, patterns);
  detectWuQiSha(chart, patterns);
  detectTongLiang(chart, patterns);
  detectRiYueTongGong(chart, patterns);
  detectRiYueJiaMing(chart, patterns);
  detectJuRiTongGong(chart, patterns);
  detectShiZhongYinYu(chart, ming, patterns);
  detectMingZhuChuHai(chart, ming, patterns);
  detectZiWeiInMing(chart, ming, patterns);

  // 助力格
  detectFuBiJiaMing(chart, patterns);
  detectChangQuJiaMing(chart, patterns);
  detectKuiYueJiaMing(chart, patterns);
  detectShuangLuChaoYuan(chart, ming, patterns);
  detectSanQiJiaHui(chart, patterns);
  detectHuaLuRuMing(chart, ming, patterns);

  // 恶格
  detectHuaJiRuMingQian(chart, patterns);
  detectYangTuoJiaJi(chart, patterns);
  detectHuoLingJiaMing(chart, patterns);
  detectKongJieJiaMing(chart, patterns);
  detectLianShaYang(chart, patterns);
  detectJuHuoYang(chart, patterns);
  detectLingChangTuoWu(chart, patterns);
  detectMaTouDaiJian(chart, ming, patterns);

  // 基础格局（提升识别覆盖率，让普通命盘也能识别 1-3 个）
  detectLuCunShouShen(chart, patterns);
  detectTianMaRuMing(chart, patterns);
  detectHuaLuRuCai(chart, patterns);
  detectHuaQuanRuGuan(chart, patterns);
  detectHuaKeRuMingShen(chart, patterns);
  detectJiYueTongLiangPartial(chart, ming, patterns);
  detectChangQuTongHui(chart, patterns);
  detectFuBiTongHui(chart, patterns);
  detectKuiYueTongHui(chart, patterns);
  detectKeQuanShuangHui(chart, patterns);

  return patterns;
}

// ────────────────── 命宫摘要（保持向后兼容）──────────────────
export function getMingGongSummary(chart: ZiweiChart): {
  stars: string[];
  keywords: string[];
  nature: string;
} {
  const mingPalace = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  if (!mingPalace) return { stars: [], keywords: [], nature: '' };

  const majorStars = mingPalace.stars.filter(s => s.type === 'major');
  const starNames = majorStars.map(s => s.name);

  const keywordMap: Record<string, string[]> = {
    '紫微': ['Tôn quý', 'Độc lập', 'Lãnh đạo'],
    '天机': ['Trí tuệ', 'Cơ biến', 'Giỏi mưu'],
    '太阳': ['Dương cương', 'Quan quý', 'Hào phóng'],
    '武曲': ['Tài phú', 'Cương nghị', 'Quả đoán'],
    '天同': ['Ôn hòa', 'Hưởng phúc', 'Tùy duyên'],
    '廉贞': ['Tài nghệ', 'Đào hoa', 'Đa biến'],
    '天府': ['Tài khố', 'Điềm đạm', 'Thận trọng'],
    '太阴': ['Nhu mỹ', 'Tài phú', 'Tinh tế'],
    '贪狼': ['Dục vọng', 'Đào hoa', 'Đa tài'],
    '巨门': ['Giỏi biện luận', 'Đa tư', 'Khẩu tài'],
    '天相': ['Phò tá', 'Hành chính', 'Vững vàng'],
    '天梁': ['Che chở', 'Y dược', 'Bề trên'],
    '七杀': ['将星', 'Quả quyết', 'Cô khắc'],
    '破军': ['Khai sáng', 'Biến động', 'Phá cũ'],
  };

  const natureMap: Record<string, string> = {
    '紫微': 'Đế vương tinh', '天机': 'Trí tuệ tinh', '太阳': 'Quý nhân tinh',
    '武曲': 'Tài bạch tinh', '天同': 'Phúc đức tinh', '廉贞': 'Đào hoa tinh',
    '天府': 'Tài khố tinh', '太阴': 'Tài phú tinh', '贪狼': 'Đào hoa tinh',
    '巨门': 'Thị phi tinh', '天相': 'Ấn thụ tinh', '天梁': 'Ấm tý tinh',
    '七杀': 'Tướng soái tinh', '破军': 'Biến động tinh',
  };

  const keywords = starNames.flatMap(n => keywordMap[n] ?? []).slice(0, 5);
  const nature = starNames.length > 0 ? (natureMap[starNames[0]] ?? '') : '空宫';

  return { stars: starNames, keywords, nature };
}
