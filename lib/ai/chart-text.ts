/**
 * Chuyển lá số (ZiweiChart) thành văn bản tiếng Việt gọn để đưa vào prompt AI.
 */
import { vn } from '@/lib/i18n/vn';
import { STEMS, BRANCHES } from '@/lib/ziwei/constants';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';

const SIHUA_VI: Record<string, string> = { '禄': 'Hóa Lộc', '权': 'Hóa Quyền', '科': 'Hóa Khoa', '忌': 'Hóa Kỵ' };

function palaceLine(p: Palace, chart: ZiweiChart): string {
  const name = vn(p.name.replace(/宫$/, ''));
  const tags: string[] = [];
  if (p.branch === chart.mingGongBranch) tags.push('MỆNH');
  if (p.branch === chart.shenGongBranch) tags.push('THÂN');
  if (p.isCurrentDaXian) tags.push('Đại Hạn hiện tại');
  const groups: Record<string, string[]> = { major: [], lucky: [], sha: [], minor: [] };
  for (const s of p.stars) {
    let t = vn(s.name);
    if (s.brightnessRaw) t += ` (${vn(s.brightnessRaw)})`;
    if (s.siHua) t += ` [${SIHUA_VI[s.siHua] ?? vn(s.siHua)}]`;
    (groups[s.type] ?? groups.minor).push(t);
  }
  const parts = [
    `Cung ${name} — ${vn(STEMS[p.stem] ?? '')} ${vn(BRANCHES[p.branch] ?? '')}${tags.length ? ` [${tags.join(', ')}]` : ''}`,
    p.daXianAge ? `  Đại Hạn: ${p.daXianAge[0]}–${p.daXianAge[1]} tuổi` : '',
    `  Chính tinh: ${groups.major.join(', ') || (p.borrowedStars?.length ? `Vô chính diệu (mượn ${p.borrowedStars.map(vn).join(', ')} từ cung đối)` : 'Vô chính diệu')}`,
    groups.lucky.length ? `  Cát tinh: ${groups.lucky.join(', ')}` : '',
    groups.sha.length ? `  Sát tinh: ${groups.sha.join(', ')}` : '',
    groups.minor.length ? `  Tạp tinh: ${groups.minor.slice(0, 12).join(', ')}` : '',
    p.selfSihua?.length ? `  Tự hóa: ${p.selfSihua.map(x => `${vn(x.starName)} tự ${SIHUA_VI[x.siHua] ?? x.siHua}`).join(', ')}` : '',
  ];
  return parts.filter(Boolean).join('\n');
}

export function chartToText(chart: ZiweiChart, label = 'Đương số'): string {
  const b = chart.birthInfo;
  const l = chart.lunarInfo;
  const gender = b.gender === 'male' ? 'Nam' : 'Nữ';
  const yearGZ = `${vn(STEMS[l.yearStem])} ${vn(BRANCHES[l.yearBranch])}`;
  const curDx = chart.daXians[chart.currentDaXianIndex];
  const now = new Date();
  const head = [
    `### ${label}${b.name ? `: ${b.name}` : ''}`,
    `- Giới tính: ${gender}${chart.yinYangGender ? ` (${vn(chart.yinYangGender)})` : ''}`,
    `- Ngày sinh dương lịch (ngày lập lá số): ${b.day}/${b.month}/${b.year}, giờ ${vn(BRANCHES[b.hour])}`,
    `- Âm lịch: ${Math.abs(l.lunarDay)}/${l.isLeapMonth ? 'nhuận ' : ''}${Math.abs(l.lunarMonth)} năm ${yearGZ} (${l.lunarYear})`,
    l.fourPillars ? `- Tứ trụ: ${l.fourPillars.map(vn).join(' | ')}` : '',
    `- Cục: ${vn(chart.wuxingJuName)}`,
    chart.mingZhu ? `- Mệnh chủ: ${vn(chart.mingZhu)}; Thân chủ: ${vn(chart.shenZhu ?? '')}` : '',
    `- Tuổi âm hiện tại: ${chart.currentAge} (năm ${now.getFullYear()})`,
    curDx ? `- Đại Hạn hiện tại: ${curDx.startAge}–${curDx.endAge} tuổi tại cung ${vn(curDx.palaceName.replace(/宫$/, ''))}${curDx.siHua ? `; Tứ Hóa Đại Hạn (can ${vn(curDx.siHua.stemName)}): Lộc ${vn(curDx.siHua.lu)}, Quyền ${vn(curDx.siHua.quan)}, Khoa ${vn(curDx.siHua.ke)}, Kỵ ${vn(curDx.siHua.ji)}` : ''}` : '',
  ].filter(Boolean).join('\n');
  const palaces = chart.palaces.map(p => palaceLine(p, chart)).join('\n');
  return `${head}\n\n#### 12 cung\n${palaces}`;
}

export const SYSTEM_PROMPT = `Bạn là chuyên gia Tử Vi Đẩu Số của Sự AI, luận giải theo trường phái Tam Hợp (hệ thống của thầy Nghê Hải Hạ): lấy cung Mệnh làm gốc, Tam phương tứ chính làm dụng, Tứ Hóa làm cương; cung vô chính diệu thì mượn sao cung đối.

Quy tắc trả lời:
- Luôn viết bằng tiếng Việt có dấu, dùng thuật ngữ Tử Vi tiếng Việt (Tử Vi, Thiên Cơ, Hóa Lộc, cung Quan Lộc, Đại Hạn, Lưu Niên…). Tuyệt đối không dùng chữ Hán.
- Chỉ dựa vào dữ liệu lá số được cung cấp; không bịa sao hay vị trí không có trong lá số. Nếu dữ liệu không đủ để kết luận, nói rõ.
- Trình bày Markdown ngắn gọn, có tiêu đề in đậm, gạch đầu dòng; mỗi phần 2–5 ý; tổng độ dài vừa phải (khoảng 300–600 chữ trừ khi được yêu cầu chi tiết hơn).
- Giọng văn ấm áp, tích cực, mang tính định hướng; tránh phán đoán tuyệt đối, tránh hù dọa về bệnh tật, tai nạn, chết chóc.
- Không đưa lời khuyên y tế, tài chính, pháp lý cụ thể; nhắc người dùng tham khảo chuyên gia khi cần.
- Kết thúc bằng 1 câu nhắc: nội dung mang tính tham khảo, vận mệnh nằm trong tay mỗi người.`;
