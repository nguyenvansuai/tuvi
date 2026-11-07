/**
 * Lớp hiển thị tiếng Việt cho thuật ngữ Tử Vi.
 *
 * Engine (lib/ziwei/*) dùng tên sao/cung chữ Hán làm khoá logic (so sánh, tra bảng),
 * nên KHÔNG đổi dữ liệu gốc. Thay vào đó, mọi chuỗi hiển thị đi qua vn():
 *   '紫微化禄' → 'Tử Vi hóa Lộc', '命宫' → 'Mệnh', '庚年' → 'năm Canh', '1990年' → 'năm 1990'.
 * components/AutoVietnamese.tsx áp vn() lên DOM để bắt mọi thuật ngữ sinh động còn sót.
 */
import TERMS_JSON from './terms.vi.json';

const TERMS: Record<string, string> = TERMS_JSON as Record<string, string>;
const MAX_LEN = Math.max(...Object.keys(TERMS).map(k => k.length));
const CJK = /[\u4e00-\u9fff]/;
const CJK_ANY = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/;

const PUNCT: Record<string, string> = {
  '，': ', ', '。': '. ', '、': ', ', '：': ': ', '；': '; ', '！': '! ', '？': '? ',
  '（': ' (', '）': ') ', '「': '“', '」': '”', '『': '“', '』': '”', '《': '«', '》': '»',
  '【': '[', '】': ']', '～': '~', '—': '—', '…': '…', '　': ' ',
};

const GANZHI = '甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥';

/** Chuyển thuật ngữ (khớp dài nhất) — không xử lý quy tắc đảo trật tự. */
function tokens(s: string): string {
  let out = '';
  let prevWord = false; // ký tự trước là chữ (cần chèn khoảng trắng)
  let i = 0;
  while (i < s.length) {
    let matched = '';
    for (let len = Math.min(MAX_LEN, s.length - i); len >= 1; len--) {
      const sub = s.substr(i, len);
      if (TERMS[sub] !== undefined) { matched = sub; break; }
    }
    if (matched) {
      const rep = TERMS[matched];
      if (prevWord && rep && !/^[\s,.;:!?)\]]/.test(rep)) out += ' ';
      out += rep;
      prevWord = /[\p{L}\p{N})]$/u.test(rep);
      i += matched.length;
      continue;
    }
    const ch = s[i];
    if (PUNCT[ch] !== undefined) {
      out = out.replace(/\s+$/, '') + PUNCT[ch];
      prevWord = false;
    } else {
      // chữ Latin / số đứng sát sau thuật ngữ → chèn khoảng trắng
      if (prevWord && /[\p{L}\p{N}]/u.test(ch) && !CJK.test(ch) && !/\s$/.test(out) && CJK.test(s[i - 1] ?? '')) out += ' ';
      out += ch;
      prevWord = /[\p{L}\p{N})]/u.test(ch) && !CJK.test(ch);
    }
    i++;
  }
  return out;
}

export function vn(input: string | null | undefined): string {
  if (!input) return input ?? '';
  if (!CJK_ANY.test(input)) return input;
  let s = input;
  // ── Quy tắc đảo trật tự (Hán: định ngữ trước, Việt: sau) ──
  s = s.replace(/(\d{3,4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g, '$3/$2/$1');
  s = s.replace(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/g, '$2/$1');
  s = s.replace(/(\d+)\s*[-–~至]\s*(\d+)\s*岁/g, ' $1–$2 tuổi ');
  s = s.replace(/(\d+)\s*岁/g, ' $1 tuổi ');
  s = s.replace(/(\d+)\s*年/g, ' năm $1 ');
  s = s.replace(/(\d+)\s*月/g, ' tháng $1 ');
  s = s.replace(/(\d+)\s*日/g, ' ngày $1 ');
  s = s.replace(/(\d+)\s*分钟/g, ' $1 phút ');
  s = s.replace(/(\d+)\s*种/g, ' $1 loại ');
  s = s.replace(/(\d+)\s*颗/g, ' $1 sao ');
  s = s.replace(/(\d+)\s*个/g, ' $1 ');
  s = s.replace(new RegExp(`([${GANZHI}]{1,2})年`, 'g'), (_m, g) => ` năm ${tokens(g)} `);
  s = s.replace(new RegExp(`([${GANZHI}])时`, 'g'), (_m, g) => ` giờ ${tokens(g)} `);
  s = s.replace(new RegExp(`([${GANZHI}])宫`, 'g'), (_m, g) => ` cung ${tokens(g)} `);
  s = s.replace(/农历\s*(\d+)/g, 'Âm lịch $1');
  let out = tokens(s);
  out = out.replace(/[ \t]{2,}/g, ' ').replace(/\s+([,.;:!?)\]])/g, '$1').replace(/\(\s+/g, '(');
  // giữ khoảng trắng đầu/cuối gốc (quan trọng với text node nằm giữa phần tử)
  const lead = /^\s/.test(input) ? ' ' : '';
  const trail = /\s$/.test(input) ? ' ' : '';
  return lead + out.trim() + trail;
}

/** Bản rút gọn tên cung: '兄弟宫' → 'Huynh Đệ' */
export function vnPalace(name: string): string {
  return vn(name.replace(/宫$/, ''));
}

export const hasCJK = (s: string) => CJK_ANY.test(s);
