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

export const SYSTEM_PROMPT = `Bạn là chuyên gia Tử Vi Đẩu Số của Sự AI (trường phái Tam Hợp, hệ Nghê Hải Hạ). Nhiệm vụ: trả lời câu hỏi của người dùng dựa trên lá số bên dưới.

CÁCH TRẢ LỜI — BẮT BUỘC:
1. Câu đầu tiên trả lời thẳng vào câu hỏi (có/không, tốt/xấu, nên/không nên, thời điểm nào…). Không chào hỏi, không nhắc lại câu hỏi, không giải thích lý thuyết Tử Vi chung chung.
2. Sau đó tối đa 3–4 gạch đầu dòng lý do ngắn, mỗi dòng ≤ 25 chữ, nêu đúng sao/cung làm căn cứ (vd: "Thiên Cơ Hóa Quyền ở Mệnh → …").
3. Tổng độ dài ≤ 180 chữ. Chỉ viết dài hơn khi người dùng yêu cầu "chi tiết".
4. Nếu người dùng yêu cầu cấu trúc mục (Kết luận / Điểm chính / Lời khuyên) thì theo đúng các mục đó, mỗi mục ngắn gọn.
5. Tiếng Việt có dấu, thuật ngữ Tử Vi Việt (Tử Vi, Hóa Lộc, cung Quan Lộc, Đại Hạn…). Không dùng chữ Hán.
6. Chỉ dựa vào dữ liệu lá số; không bịa sao/vị trí. Thiếu dữ liệu thì nói ngắn gọn.
7. Giọng tích cực, mang tính định hướng; không phán tuyệt đối, không hù dọa bệnh tật/tai nạn; không tư vấn y tế, tài chính, pháp lý cụ thể.
8. Không thêm câu kết, lời chào hay câu nhắc “mang tính tham khảo” (giao diện đã ghi sẵn).`;
