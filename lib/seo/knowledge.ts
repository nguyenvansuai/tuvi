/**
 * SEO 知识页 — 数据 helper
 *
 * 14 主星 × 13 topic = 182 个独立 SEO URL
 * 每页都是 STAR_DB 中对应字段的 4 段 markers（一句话定调/核心论断/命盘依据/经典出处）
 */

import { STAR_DB } from '@/lib/ziwei/db-analysis';
import type { TopicKey } from '@/lib/ziwei/db-analysis';
import { TOPIC_PALACE_NAME, TOPIC_LABEL } from '@/lib/ziwei/db-analysis';

export const ALL_STARS = [
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军',
];

// 主星名 ↔ 拼音 slug 映射（URL 用 slug，避免中文 URL 在 Vercel/CDN 上的边界问题）
export const STAR_TO_SLUG: Record<string, string> = {
  '紫微': 'ziwei',
  '天机': 'tianji',
  '太阳': 'taiyang',
  '武曲': 'wuqu',
  '天同': 'tiantong',
  '廉贞': 'lianzhen',
  '天府': 'tianfu',
  '太阴': 'taiyin',
  '贪狼': 'tanlang',
  '巨门': 'jumen',
  '天相': 'tianxiang',
  '天梁': 'tianliang',
  '七杀': 'qisha',
  '破军': 'pojun',
};

export const SLUG_TO_STAR: Record<string, string> = Object.fromEntries(
  Object.entries(STAR_TO_SLUG).map(([k, v]) => [v, k])
);

export const ALL_TOPICS: TopicKey[] = [
  'overview', 'personality', 'love', 'career', 'wealth', 'health',
  'family', 'children', 'move', 'friends', 'home', 'spirit', 'parents',
];

interface StarContent {
  mingGong: string;
  personality: string;
  xiongDi?: string;
  fuQi: string;
  ziNv?: string;
  caiBo: string;
  jiE: string;
  qianYi?: string;
  jiaoYou?: string;
  guanLu: string;
  tianZhai?: string;
  fuDe?: string;
  fuMu?: string;
}

const TOPIC_TO_FIELD: Record<TopicKey, keyof StarContent> = {
  overview:    'mingGong',
  personality: 'personality',
  love:        'fuQi',
  career:      'guanLu',
  wealth:      'caiBo',
  health:      'jiE',
  family:      'xiongDi' as keyof StarContent,
  children:    'ziNv' as keyof StarContent,
  move:        'qianYi' as keyof StarContent,
  friends:     'jiaoYou' as keyof StarContent,
  home:        'tianZhai' as keyof StarContent,
  spirit:      'fuDe' as keyof StarContent,
  parents:     'fuMu' as keyof StarContent,
};

interface ParsedContent {
  dingdiao: string;
  lundian: string;
  yiju: string;
  chuchu: string;
  raw: string;
  hasMarkers: boolean;
}

function parseStarContent(content: string): ParsedContent {
  const out: ParsedContent = { dingdiao: '', lundian: '', yiju: '', chuchu: '', raw: content, hasMarkers: false };
  if (!content) return out;
  if (!content.includes('**[Tóm tắt một câu]**') && !content.includes('**[Luận đoán cốt lõi]**')) {
    out.lundian = content;
    return out;
  }
  out.hasMarkers = true;
  const re = /\*\*【([^】]+)】\*\*/g;
  const parts: { name: string; markerEnd: number; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    parts.push({ name: m[1], start: m.index, markerEnd: m.index + m[0].length });
  }
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const end = i + 1 < parts.length ? parts[i + 1].start : content.length;
    const text = content.slice(p.markerEnd, end).trim();
    if (p.name === '一句话定调') out.dingdiao = text;
    else if (p.name === '核心论断') out.lundian = text;
    else if (p.name === '命盘依据') out.yiju = text;
    else if (p.name === '经典出处') out.chuchu = text;
  }
  return out;
}

export interface KnowledgeData {
  star: string;
  topic: TopicKey;
  topicLabel: string;
  palaceName: string;
  parsed: ParsedContent;
  exists: boolean;
}

export function getKnowledge(star: string, topic: TopicKey): KnowledgeData {
  const profile = STAR_DB[star] as StarContent | undefined;
  const field = TOPIC_TO_FIELD[topic];
  const content = profile && field ? (profile[field] as string | undefined) ?? '' : '';
  return {
    star,
    topic,
    topicLabel: TOPIC_LABEL[topic],
    palaceName: TOPIC_PALACE_NAME[topic],
    parsed: parseStarContent(content),
    exists: Boolean(content),
  };
}

/** 生成所有 14×13 组合（用于 generateStaticParams） */
export function getAllKnowledgeRoutes() {
  const routes: { star: string; slug: string; topic: TopicKey }[] = [];
  for (const star of ALL_STARS) {
    for (const topic of ALL_TOPICS) {
      const data = getKnowledge(star, topic);
      if (data.exists) routes.push({ star, slug: STAR_TO_SLUG[star], topic });
    }
  }
  return routes;
}

/** 主星属性简介（用于 SEO 页"了解 XX 星"section） */
export const STAR_BRIEF_SEO: Record<string, string> = {
  '紫微': 'Tử Vi là đế tinh, chủ tôn quý, hóa khí là Tôn. Tọa Mệnh có khí chất lãnh đạo, hợp vị trí cao ở tổ chức lớn.',
  '天机': 'Thiên Cơ là trí tuệ tinh, chủ linh hoạt lanh lợi, hóa khí là Thiện. Tọa Mệnh thông minh cơ biến, hợp phò tá, hoạch định.',
  '太阳': 'Thái Dương là sao quý của nam, chủ danh dự, công vụ, hóa khí là Quý. Tọa Mệnh quang minh lỗi lạc, hợp công chức, danh tiếng.',
  '武曲': 'Vũ Khúc là tài tinh, chủ cương nghị quả quyết, hóa khí là Tài. Tọa Mệnh giỏi quản lý tiền, hợp thực nghiệp, tài chính.',
  '天同': 'Thiên Đồng là phúc tinh, chủ ôn hòa hưởng lạc, hóa khí là Phúc. Tọa Mệnh tính ôn hòa, có phúc.',
  '廉贞': 'Liêm Trinh là thứ đào hoa, văn võ kiêm toàn, hóa khí là Tù. Tọa Mệnh đa tài đa nghệ, tình cảm phong phú.',
  '天府': 'Thiên Phủ là Nam Đẩu đế tinh giữ của, chủ điềm đạm thận trọng, hóa khí là Lệnh. Tọa Mệnh phẩm hạnh đoan chính, giỏi giữ kho tài.',
  '太阴': 'Thái Âm là sao phú quý của mặt trăng, chủ nhà đất giàu sang, hóa khí là Phú. Tọa Mệnh tình cảm tinh tế, nữ mệnh tốt nhất.',
  '贪狼': 'Tham Lang là sao đào hoa dục vọng, đa tài giỏi giao tiếp, hóa khí là Đào hoa. Tọa Mệnh nhiều tài nghệ, quan hệ rộng.',
  '巨门': 'Cự Môn là sao thị phi khẩu tài, chủ biện luận, truyền thông, hóa khí là Ám. Tọa Mệnh ăn nói giỏi, hợp luật sư, giáo viên.',
  '天相': 'Thiên Tướng là ấn tinh phò tá, chủ trung hậu thật thà, hóa khí là Ấn. Tọa Mệnh phẩm hạnh đoan chính, hợp hành chính, pháp chế.',
  '天梁': 'Thiên Lương là sao lão nhân, ấm tinh, giỏi gặp hung hóa cát, hóa khí là Ấm. Tọa Mệnh từ bi lương thiện, hợp pháp luật, y học.',
  '七杀': 'Thất Sát là tướng tinh, chủ cô độc quả quyết mạo hiểm, hóa khí là Túc sát. Tọa Mệnh cương nghị quả quyết, hợp quân đội, công an, khởi nghiệp.',
  '破军': 'Phá Quân là sao phá cũ đổi mới, chủ lục thân duyên mỏng, hóa khí là Hao. Tọa Mệnh khai sáng biến động, hợp chuyên môn kỹ thuật.',
};
