'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import StarField from '@/components/StarField';
import { useTheme, type Theme } from '@/components/ThemeProvider';

// ─── 滚动入场 wrapper ────────────────────────────────────
function FadeIn({
  children, delay = 0, y = 28, className = '',
}: {
  children: React.ReactNode; delay?: number; y?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function WeakBoundary({ line }: { line: string }) {
  // 之前的版本有 1px 实线 + 12px 渐变阴影，主题切换时形成清晰横线很硬。
  // 改为更柔和的 24px 渐变 + 低 opacity，section 衔接更自然。
  return (
    <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
      style={{ background: `linear-gradient(to bottom, ${line}, transparent)`, opacity: 0.45 }} />
  );
}

// ─── 主题切换按钮 ────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.93 }}
      aria-label={isDark ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối'}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
      style={{
        borderColor: isDark ? 'rgba(212,168,67,0.3)' : 'rgba(140,100,20,0.35)',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,252,242,0.85)',
        transition: 'background 0.35s ease, border-color 0.35s ease',
      }}
    >
      <div className="relative w-10 h-5 rounded-full flex-shrink-0"
        style={{
          background: isDark ? 'rgba(12,24,64,0.95)' : 'rgba(230,195,80,0.55)',
          transition: 'background 0.35s ease',
        }}>
        <motion.div
          animate={{ x: isDark ? 2 : 22 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="absolute top-1 w-3.5 h-3.5 rounded-full"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #b8a050, #e8d090)'
              : 'linear-gradient(135deg, #e89010, #f8d050)',
          }}
        />
      </div>
      <span className="text-[11px] font-medium tracking-wide select-none"
        style={{
          color: isDark ? 'rgba(212,180,100,0.85)' : 'rgba(110,72,8,0.8)',
          transition: 'color 0.35s ease',
        }}>
        {isDark ? '暗色' : '亮色'}
      </span>
    </motion.button>
  );
}

// ─── 主星数据 ────────────────────────────────────────────
const STARS = [
  { name: '紫微' }, { name: '天机' }, { name: '太阳' }, { name: '武曲' },
  { name: '天同' }, { name: '廉贞' }, { name: '天府' }, { name: '太阴' },
  { name: '贪狼' }, { name: '巨门' }, { name: '天相' }, { name: '天梁' },
  { name: '七杀' }, { name: '破军' },
];

// ─── 功能模块 ────────────────────────────────────────────
const FEATURES = [
  {
    tag: 'Hệ lập lá số',
    title: 'Hệ Nghê Hải Hạ\n紫微斗数',
    subtitle: 'Không phải bản giản lược, tuân thủ nghiêm truyền thừa của thầy Nghê Hải Hạ',
    points: [
      'Khởi lá số theo Nạp Âm Ngũ Hành Cục, không dùng thuật toán giản lược trên mạng',
      'Cung Mệnh đếm nghịch giờ sinh, cung Thân đếm thuận giờ sinh, đúng quy tắc giảng dạy',
      '14 chính tinh và Tứ Hóa an theo phép gốc, cấu trúc đầy đủ, kiểm chứng được',
    ],
  },
  {
    tag: 'Hiển thị lá số',
    title: 'Đủ 14 chính tinh\n四化飞星',
    subtitle: 'Bố cục rõ ràng, nhìn là thấy trục chính và trọng điểm',
    points: [
      '14 chính tinh nhập cung đầy đủ, quan hệ giữa các sao dễ đọc',
      'Phụ tinh và sát tinh hiển thị cùng màn hình, không sót thông tin quan trọng',
      'Phân cấp độ sáng Miếu – Vượng – Lợi – Hãm, nhận biết nhanh sao mạnh yếu',
      'Bấm vào bất kỳ chính tinh nào để xem luận giải chi tiết theo thầy Nghê Hải Hạ',
    ],
  },
  {
    tag: 'AI Luận giải',
    title: 'Luận giải sâu\n không chỉ lập lá số',
    subtitle: 'Kho kiến thức hệ Nghê Hải Hạ × Claude AI',
    points: [
      'Phân tích mệnh cách: từ chính tinh cung Mệnh, kết hợp Tam phương tứ chính, đánh giá toàn diện tính cách và cách cục cuộc đời',
      'Luận giải 6 khía cạnh: sự nghiệp, tình cảm hôn nhân, tài lộc, sức khỏe, gia đình, con cái',
      'Theo dõi Đại Hạn – Lưu Niên: trọng điểm Đại Hạn 10 năm hiện tại, gợi ý cụ thể cho cung Lưu Niên năm nay',
      'Hỏi tự do về lá số của bạn: “Năm nay có nên đổi việc?”, “Khi nào duyên kết hôn tốt nhất?”',
    ],
  },
  {
    tag: 'Nhận diện cách cục',
    title: 'Tự động phát hiện\n cách cục lá số',
    subtitle: 'Khám phá vận mệnh qua tổ hợp các sao',
    points: [
      'Tự động nhận diện các cách cục kinh điển: Tử Phủ đồng cung, Sát Phá Tham, Cơ Nguyệt Đồng Lương, Liêm Tướng, Vũ Khúc Thất Sát…',
      'Phát hiện chính xác các cách đặc biệt như Tả Hữu giáp Mệnh, Nhật Nguyệt giáp Mệnh, kèm luận giải chuẩn theo hệ Nghê Hải Hạ',
      'Tự đánh dấu Tứ Hóa nhập cung Mệnh, Thiên Di, nhắc các chủ đề cuộc đời cần lưu ý',
      'Cách cục được xếp theo mức cát hung, nhìn là thấy ưu thế và thử thách trong lá số',
    ],
  },
];

// ─── 4 大学习板块（hero 后时间轴）──────────────────────────
const SECTIONS = [
  {
    key: 'ziwei',
    name: '紫微',
    en: 'Zi Wei',
    desc: '14 主星 · 13 宫位 · AI Luận giải',
    status: 'ready' as const,
    when: '5 月',
    icon: '◉',  // 实心圆+内点，紫微星视觉
    note: '',
  },
  {
    key: 'tianji',
    name: 'Thiên Kỷ',
    en: 'Tian Ji',
    desc: 'Tử Vi · Chu Dịch · Kỳ Môn Độn Giáp',
    status: 'soon' as const,
    when: '6 月',
    icon: '⊙',  // 圆+内点（古文"日"），与 ◉ 同字宽
    note: '',
  },
  {
    key: 'diji',
    name: 'Địa Kỷ',
    en: 'Di Ji',
    desc: 'Phần dang dở của thầy Nghê · hậu học bổ chú',
    status: 'soon' as const,
    when: '6 月',
    icon: '⊞',  // 方+井（地/田视觉），与 ⊙ 同字宽
    note: 'Nghiên cứu di cảo',
  },
  {
    key: 'renji',
    name: 'Nhân Kỷ',
    en: 'Ren Ji',
    desc: 'Nội Kinh · Thương Hàn · Kim Quỹ · Châm cứu',
    status: 'soon' as const,
    when: '7 月',
    icon: '⊕',  // 圆+十字（医道/阴阳调和），与 ⊙/⊞ 同字宽
    note: '',
  },
];

// ─── 倪海厦核心教义 ──────────────────────────────────────
const NI_TEACHINGS = [
  {
    title: 'Cung Mệnh là gốc, Tam phương là dụng',
    body: 'Thầy Nghê luôn nhấn mạnh: xem mệnh trước hết phải xem cung Mệnh. Chính tinh cung Mệnh quyết định cách cục cơ bản và tính cách bẩm sinh; Tam phương (Tài Bạch, Quan Lộc, Thiên Di) quyết định “đất dụng võ”. Bốn cung liên động mới là bức tranh cuộc đời đầy đủ.',
  },
  {
    title: 'Mượn sao cung đối, không thể bỏ qua',
    body: 'Điểm độc đáo của thầy Nghê là coi trọng “cung đối”. Cung nào vô chính diệu phải mượn sao cung đối để luận; đối diện cung Mệnh là Thiên Di, hai cung ảnh hưởng lẫn nhau — điều người mới học hay bỏ sót.',
  },
  {
    title: 'Tứ Hóa mới là bàn tay của vận mệnh',
    body: 'Sao chỉ là nền tảng, Tứ Hóa (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ) mới quyết định vận tốt xấu. Cùng một sao, có Hóa Lộc hay Hóa Kỵ thì quỹ đạo cuộc đời khác hẳn. Thầy Nghê nhấn mạnh: không xem Tứ Hóa thì mới giải được một nửa lá số.',
  },
  {
    title: 'Đại Hạn mười năm, vận có tiết',
    body: 'Thầy Nghê chia đời người thành 12 Đại Hạn, mỗi Đại Hạn 10 năm. Ở mỗi cung Đại Hạn, cơ duyên hoàn toàn khác nhau. Biết mình đang đi Đại Hạn nào, cung đó có sao gì, mới thực sự nắm được vận hiện tại.',
  },
];

// ─── 主题色彩 helper ─────────────────────────────────────
function useColors(theme: Theme) {
  const d = theme === 'dark';
  return {
    bgBase:       d ? '#020810'                                : '#f5efe0',
    // nav 用与 bgBase 完全相同的不透明色，避免半透明叠加产生色差带
    navBg:        d ? '#020810'                                : '#f5efe0',
    navBorder:    d ? 'rgba(255,255,255,0.05)'                : 'rgba(160,120,30,0.15)',
    goldGrad:     d ? 'linear-gradient(160deg,#c8993a 0%,#f0d070 40%,#c8993a 70%,#f0c755 100%)'
                    : 'linear-gradient(160deg,#6a4206 0%,#9a6a10 40%,#6a4206 70%,#885010 100%)',
    goldSolid:    d ? '#d4a843'                               : '#8b6410',
    goldLine:     d ? 'rgba(212,168,67,0.4)'                  : 'rgba(140,100,20,0.4)',
    tagText:      d ? 'rgba(212,168,67,0.6)'                  : 'rgba(120,80,10,0.65)',
    // 亮色文字用冷灰系（A 方案核心）：暖底 + 冷字 → 视觉不审美疲劳
    textPrimary:  d ? '#e8eef6'                               : '#1a1d24',
    textSecond:   d ? '#b8c6df'                               : '#3a3f4a',
    textMuted:    d ? '#9db0d0'                               : '#5a6275',
    textFaint:    d ? 'rgba(240,246,255,0.56)'                : '#9da4b3',
    // 冷色 accent（B 方案核心）：呼应暗色 quan 蓝；用于装饰性 glow / 链接 / 高亮
    accent:       d ? '#3a78d4'                               : '#3a5a82',
    accentSoft:   d ? 'rgba(58,120,212,0.18)'                 : 'rgba(58,90,130,0.10)',
    cardBg:       d ? 'rgba(255,255,255,0.05)'                : 'rgba(255,255,255,0.88)',
    cardBorder:   d ? 'rgba(255,255,255,0.10)'                : 'rgba(200,160,60,0.25)',
    cardShadow:   d ? '0 4px 32px rgba(0,0,0,0.5)'           : '0 4px 24px rgba(140,100,20,0.12)',
    featureBg:    d ? 'rgba(255,255,255,0.04)'                : 'rgba(255,255,255,0.75)',
    featureBord:  d ? 'rgba(255,255,255,0.08)'                : 'rgba(200,160,60,0.2)',
    glowTint:     d ? 'rgba(212,168,67,0.07)'                 : 'rgba(180,140,40,0.06)',
    // 亮色 glow 真用蓝/紫——给整体氛围加冷色点缀
    glowBlue:     d ? 'rgba(40,80,160,0.12)'                  : 'rgba(58,90,130,0.06)',
    glowPurple:   d ? 'rgba(120,50,180,0.08)'                 : 'rgba(96,80,140,0.04)',
    niBg:         d ? 'rgba(255,255,255,0.04)'                : 'rgba(255,255,255,0.8)',
    niBorder:     d ? 'rgba(212,168,67,0.2)'                  : 'rgba(180,130,40,0.25)',
    niDivider:    d ? 'rgba(255,255,255,0.08)'                : 'rgba(180,130,40,0.12)',
    niCardBg:     d ? 'rgba(255,255,255,0.04)'                : 'rgba(255,255,255,0.9)',
    niCardBord:   d ? 'rgba(255,255,255,0.08)'                : 'rgba(200,160,60,0.2)',
    niCardShadow: d ? '0 2px 20px rgba(0,0,0,0.4)'           : '0 2px 16px rgba(140,100,20,0.1)',
    starBg:       d ? 'rgba(255,255,255,0.04)'                : 'rgba(255,255,255,0.7)',
    starBorder:   d ? 'rgba(212,168,67,0.22)'                 : 'rgba(160,120,30,0.3)',
    starText:     d ? 'rgba(212,168,67,0.7)'                  : 'rgba(120,80,10,0.7)',
    ctaBg:        d ? 'linear-gradient(135deg,#b8892a,#f0d070,#b8892a)'
                    : 'linear-gradient(135deg,#6a4206,#9a6810,#6a4206)',
    ctaText:      d ? '#08080a'                               : '#f8f3e8',
    footerText:   d ? 'rgba(255,255,255,0.08)'                : '#d0b878',
    scrollLine:   d ? 'rgba(212,168,67,0.3)'                  : 'rgba(140,100,20,0.3)',
    scrollText:   d ? 'rgba(255,255,255,0.12)'                : '#c0a870',
    altSection:   d ? 'rgba(255,255,255,0.02)'                : 'rgba(255,255,255,0.4)',
    quoteBg:      d ? 'rgba(212,168,67,0.04)'                 : 'rgba(255,255,255,0.9)',
  };
}

// ─── 四化简介数据 ─────────────────────────────────────────
const SIHUA_BRIEF: Record<string, { attr: string; brief: string }> = {
  '化禄': { attr: 'Cát hóa · Tăng ích', brief: 'Phúc tinh đến cung, chủ tài lộc và phúc khí tăng. Việc của cung đó thuận lợi, năng lực tăng — là hóa tinh được ưa nhất trong lá số.' },
  '化权': { attr: 'Cát hóa · Quyền uy', brief: 'Sao quyền lực đến cung, chủ khả năng kiểm soát và lãnh đạo. Cung đó mạnh mẽ, quyết đoán; ưa nhập Quan Lộc và Mệnh, chủ thực quyền trong sự nghiệp.' },
  '化科': { attr: 'Cát hóa · Danh dự', brief: 'Sao khoa danh đến cung, chủ danh tiếng và quý nhân. Cung đó chủ văn danh, thi cử, có quý nhân nâng đỡ; hợp học thuật, thi cử và nơi công cộng.' },
  '化忌': { attr: 'Hung hóa · Trở ngại', brief: 'Sao kiếp số đến cung, chủ chấp niệm và trở ngại. Cung đó cần đặc biệt lưu ý, bài học cuộc đời của cung này sẽ là thử thách quan trọng.' },
};

// ─── 主星简介数据 ─────────────────────────────────────────
const STAR_BRIEF: Record<string, { attr: string; brief: string }> = {
  '紫微': { attr: 'Thổ · Đế tinh', brief: 'Sao quý của Thiên Hoàng, thống lĩnh các sao. Người tọa Mệnh có khí chất cô ngạo, chủ quyền uy hiển đạt, bẩm sinh có tố chất lãnh đạo, hợp vị trí tự gánh vác một phương.' },
  '天机': { attr: 'Mộc · Trí tuệ tinh', brief: 'Sao ích thọ, chủ mưu trí và biến động. Thông minh lanh lợi, giỏi trù tính, tâm tư tinh tế; hợp công việc kế hoạch, tư vấn, kỹ thuật.' },
  '太阳': { attr: 'Hỏa · Chủ Quan Lộc', brief: 'Chủ tinh Quan Lộc, chủ danh tiếng và uy vọng. Hào phóng rộng lượng, coi trọng hình ảnh trước công chúng; lợi quan trường, công chức; nam mệnh mạnh, nhập Miếu thì quang minh lỗi lạc.' },
  '武曲': { attr: 'Kim · Chủ Tài Bạch', brief: 'Chủ tinh Tài Bạch, chủ tài chính và quyết đoán. Ý chí kiên định, hành động quả cảm; hợp tài chính, ngân hàng, quân đội, công an; là sao cô khắc, lợi kết hôn muộn.' },
  '天同': { attr: 'Thủy · Phúc tinh', brief: 'Chủ tinh Phúc Đức, chủ hưởng thụ và nhân duyên. Tính ôn hòa, rất được lòng người, chú trọng chất lượng sống, tình cảm tinh tế, về già vận tốt.' },
  '廉贞': { attr: 'Hỏa · Sao tài nghệ', brief: 'Thứ đào hoa tinh, chủ tài nghệ và tình dục. Tài hoa xuất chúng, tình cảm phong phú; hợp nghệ thuật, chính trường; đa tài nhưng cần phòng thị phi đào hoa.' },
  '天府': { attr: 'Thổ · Sao tài khố', brief: 'Chủ tinh Nam Đẩu, chủ kho tài và tích lũy. Điềm đạm, thận trọng, giỏi quản lý tiền; là lực ổn định của lá số, hợp quản lý tài chính và hành chính.' },
  '太阴': { attr: 'Thủy · Chủ Điền Trạch', brief: 'Chủ tinh Điền Trạch, chủ của cải và sự nhu hòa. Tinh tế dịu dàng, cảm nhận tốt, nữ mệnh càng đẹp; lợi bất động sản, tích lũy; hợp văn nghệ hoặc dịch vụ.' },
  '贪狼': { attr: 'Mộc Thủy · Đào hoa', brief: 'Sao đào hoa, chủ dục vọng và tài nghệ. Đa tài đa nghệ, ham muốn mạnh, giao tiếp năng động; hợp nghệ thuật, quan hệ công chúng, kinh doanh; rất được lòng người.' },
  '巨门': { attr: 'Thủy · Sao thị phi', brief: 'Ám tinh, chủ khẩu tài và thị phi. Ăn nói xuất chúng, tư duy phản biện tốt; hợp luật sư, giáo dục, truyền thông; cần chú ý khẩu thiệt, lập thân bằng tài biện luận.' },
  '天相': { attr: 'Thủy · Ấn tinh', brief: 'Ấn tinh, chủ phò tá và ấn thụ. Giỏi điều phối, trọng lễ nghĩa, chính trực tuân pháp; hợp tham mưu, hành chính, pháp luật; vận quý nhân tốt.' },
  '天梁': { attr: 'Thổ · Ấm tinh', brief: 'Ấm tinh, chủ chín chắn và che chở. Chính trực điềm đạm, giàu lòng từ bi, được trời phù hộ; hợp y tế, công tác xã hội, tôn giáo.' },
  '七杀': { attr: '金火·将星', brief: 'Tướng tinh, chủ cương liệt và khai sáng. Tính cương nghị, hành động mạnh, dám thử thách; hợp khởi nghiệp, quân đội, công an, ngành cạnh tranh; gặp hung hóa cát.' },
  '破军': { attr: 'Thủy · Hao tinh', brief: 'Hao tinh, chủ biến động và khai phá. Dám đột phá, không sợ thay đổi, đời nhiều biến động nhưng có khí phách; hợp công việc khai phá, đi con đường người khác chưa đi.' },
};

// ─── 功能视觉装饰 ────────────────────────────────────────
function FeatureVisual({ index, colors: c }: { index: number; colors: ReturnType<typeof useColors> }) {
  if (index === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5">
        <div className="grid grid-cols-4 gap-1.5 w-72 mx-auto">
          {Array.from({ length: 16 }).map((_, i) => {
            const isCenter = [5, 6, 9, 10].includes(i);
            const isActive = [0, 3, 12, 15].includes(i);
            return (
              <motion.div key={i}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="h-14 rounded-sm flex items-center justify-center text-xs transition-all duration-300"
                style={{
                  border: `1px solid ${isActive ? c.goldLine : c.cardBorder}`,
                  background: isCenter ? 'transparent' : isActive ? c.starBg : c.featureBg,
                  color: isActive ? c.goldSolid : c.textFaint,
                  opacity: isCenter ? 0 : 1,
                }}>
                {isActive ? '★' : ''}
              </motion.div>
            );
          })}
        </div>
        <p className="text-[10px] tracking-widest transition-colors duration-300"
          style={{ color: c.textFaint }}>Phép lập lá số Nghê Hải Hạ</p>
      </div>
    );
  }

  if (index === 1) {
    const [sel, setSel] = useState<string | null>(null);
    const selInfo = sel ? (STAR_BRIEF[sel] ?? SIHUA_BRIEF[sel] ?? null) : null;
    return (
      <div className="flex flex-col gap-4 h-full justify-center">
        {[
          { group: 'Chòm Tử Vi', stars: ['紫微', '天机', '太阳', '武曲', '天同', '廉贞'] },
          { group: 'Chòm Thiên Phủ', stars: ['天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'] },
        ].map(group => (
          <div key={group.group}>
            <div className="text-[11px] tracking-widest mb-2 transition-colors duration-300"
              style={{ color: c.textFaint }}>{group.group}</div>
            <div className="flex flex-wrap gap-1.5">
              {group.stars.map(s => (
                <motion.button key={s}
                  onClick={() => setSel(sel === s ? null : s)}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="text-xs px-2 py-1 rounded-md cursor-pointer"
                  style={{
                    border: `1px solid ${sel === s ? c.goldSolid : c.goldLine}`,
                    color: c.goldSolid,
                    background: sel === s ? `${c.goldLine}30` : 'transparent',
                    fontWeight: sel === s ? 600 : 400,
                  }}>
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className="text-[11px] tracking-widest mb-2 transition-colors duration-300"
            style={{ color: c.textFaint }}>四化飞星</div>
          <div className="flex gap-2 flex-wrap">
            {[['化禄', 'rgba(52,211,153,0.7)'], ['化权', 'rgba(96,165,250,0.7)'], ['化科', 'rgba(250,204,21,0.7)'], ['化忌', 'rgba(248,113,113,0.7)']].map(([label, color]) => (
              <motion.button key={label}
                onClick={() => setSel(sel === label ? null : label)}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="text-xs px-2.5 py-1 rounded-md cursor-pointer"
                style={{
                  border: `1px solid ${color}`,
                  color,
                  background: sel === label ? `${color.replace('0.7', '0.15')}` : 'transparent',
                  fontWeight: sel === label ? 600 : 400,
                }}>
                {label}
              </motion.button>
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          {selInfo && (
            <motion.div key={sel}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl p-4 mt-1.5"
              style={{ border: `1px solid ${c.goldLine}`, background: c.featureBg }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold" style={{ color: c.goldSolid }}>{sel}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ color: c.tagText, border: `1px solid ${c.goldLine}` }}>{selInfo.attr}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: c.textSecond }}>{selInfo.brief}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (index === 2) {
    const msgs = [
      { role: 'user', text: 'Sự nghiệp năm nay của tôi thế nào?' },
      { role: 'ai', text: 'Cung Mệnh có Thiên Cơ Hóa Lộc, Đại Hạn năm nay đi cung Quan Lộc, Tam phương có Tả Phù trợ giúp, sự nghiệp có quý nhân nâng đỡ, nên chủ động mở rộng…' },
      { role: 'user', text: 'Khi nào tình duyên tốt nhất?' },
    ];
    return (
      <div className="flex flex-col gap-2 h-full justify-center">
        {msgs.map((m, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] text-[11px] px-3 py-2 rounded-lg leading-relaxed"
              style={{
                border: `1px solid ${m.role === 'user' ? c.goldLine : c.cardBorder}`,
                background: m.role === 'user' ? c.starBg : c.featureBg,
                color: m.role === 'user' ? c.goldSolid : c.textSecond,
              }}>
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (index === 3) {
    const patterns = [
      { name: 'Cách Sát Phá Tham', desc: 'Mệnh khai sáng, tiến thủ', ok: true },
      { name: 'Cách Liêm Tướng',   desc: 'Cách hành chính ấn thụ', ok: true },
      { name: 'Hóa Kỵ nhập Mệnh', desc: 'Cần chú ý vấn đề tâm lý', ok: false },
    ];
    return (
      <div className="flex flex-col gap-3 h-full justify-center">
        {patterns.map((p, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{
              border: `1px solid ${p.ok ? 'rgba(96,165,250,0.25)' : 'rgba(251,146,60,0.25)'}`,
              background: p.ok ? 'rgba(96,165,250,0.05)' : 'rgba(251,146,60,0.05)',
            }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: p.ok ? 'rgba(96,165,250,0.6)' : 'rgba(251,146,60,0.6)' }} />
            <div>
              <div className="text-[11px] font-medium"
                style={{ color: p.ok ? 'rgba(147,197,253,0.8)' : 'rgba(253,186,116,0.8)' }}>{p.name}</div>
              <div className="text-[10px]" style={{ color: c.textMuted }}>{p.desc}</div>
            </div>
          </motion.div>
        ))}
        <div className="text-[9px] mt-2 tracking-wider text-center" style={{ color: c.textFaint }}>
          Tự động nhận diện 11 cách cục kinh điển
        </div>
      </div>
    );
  }

  return null;
}

// ─── 主页 ─────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = useColors(theme);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  // 把 body / html 背景同步到 home 主题色，消除半透明 nav 透出 #fafaf9 的色差
  // useLayoutEffect 保证在浏览器绘制前同步更新，避免与根 div 的 transition 不同步
  useLayoutEffect(() => {
    document.documentElement.style.background = c.bgBase;
    document.body.style.background = c.bgBase;
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, [c.bgBase]);

  return (
    <div style={{ background: c.bgBase, transition: 'background 0.35s ease' }} className="overflow-x-hidden">
      {/* 致用户公告——首次访问全屏覆盖，关闭后才进入首页 */}

      <StarField />

      {/* 全局光晕 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowTint} 0%, transparent 70%)` }} />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowBlue} 0%, transparent 70%)` }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${c.glowPurple} 0%, transparent 70%)` }} />
      </div>

      {/* ── 顶部导航 ── nav 与 hero 同色（c.bgBase），无 blur 无 border，彻底无色差带 */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 gap-2"
        style={{
          background: c.navBg,
        }}>
        <div className="text-[11px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] font-medium transition-colors duration-300 flex-shrink-0"
          style={{ color: c.goldSolid }}>
          紫微命盘
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <ThemeToggle />
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/heming')}
            className="text-[11px] sm:text-xs px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all duration-300"
            style={{ border: `1px solid ${c.navBorder}`, color: c.textMuted }}>
            Hợp lá số
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/chart')}
            className="text-[11px] sm:text-xs px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all duration-300"
            style={{ border: `1px solid ${c.goldLine}`, color: c.goldSolid }}>
            Lập lá số ngay
          </motion.button>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[82svh] lg:min-h-[92vh] flex flex-col items-center justify-center px-6 z-10 pb-24 pt-10">
        <motion.div style={{ y: heroY, opacity: heroOpacity, maxWidth: '960px' }} className="text-center w-full mx-auto mt-10">
          {/* 标签行 */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
            <span className="text-[11px] tracking-[0.45em] transition-colors duration-300" style={{ color: c.tagText }}>
              Tử Vi Đẩu Số · Hệ Nghê Hải Hạ
            </span>
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
          </motion.div>

          {/* 主标题 */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ position: 'relative', display: 'inline-block' }}>
            <h1
              className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold leading-none mb-5`}
              style={{
                fontSize: 'clamp(56px, 10vw, 124px)',
                letterSpacing: '0.07em',
              }}>
              紫微命盘
            </h1>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="text-base md:text-lg tracking-[0.18em] mb-2"
            style={{ color: c.textSecond, fontWeight: 500 }}>
            Tử Vi làm cửa · Thiên Địa Nhân làm đường · Nghê Hải Hạ làm thầy
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="text-xs md:text-sm tracking-[0.3em] mb-6"
            style={{ color: c.textMuted, opacity: 0.85 }}>
            AI Hỏi đáp · Tri hành hợp nhất
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="text-sm max-w-xl mx-auto leading-relaxed mb-10"
            style={{ color: c.textMuted }}>
            Nhập ngày giờ sinh để tạo lá số Tử Vi Đẩu Số của riêng bạn, kèm AI luận giải bằng tiếng Việt.
          </motion.p>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="flex flex-col items-center gap-4">
            <motion.button
              whileHover={{ y: -2, filter: 'brightness(1.06)' }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/chart')}
              className="px-12 py-4 font-semibold text-base tracking-widest rounded-full"
              style={{ background: c.ctaBg, color: c.ctaText }}>
              Lập lá số ngay
            </motion.button>
          </motion.div>

          {/* 十四主星 */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.05, duration: 0.8 }}
            className="mt-12 grid grid-cols-7 gap-1.5 max-w-[540px] mx-auto">
            {STARS.map((star, i) => (
              <motion.div key={star.name}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.05 + i * 0.03, duration: 0.35 }}
                className="flex items-center justify-center px-2 py-1 rounded-full"
                style={{ background: c.starBg, border: `1px solid ${c.starBorder}` }}>
                <span className="text-[11px] tracking-wide" style={{ color: c.starText }}>{star.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* 上线公告便利贴 — 桌面端绝对定位右侧 */}
        <motion.div
          initial={{ opacity: 0, x: 30, rotate: 0 }}
          animate={{ opacity: 1, x: 0, rotate: -4 }}
          transition={{ delay: 1.4, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute hidden lg:block pointer-events-none"
          style={{
            right: 'clamp(2%, 6vw, 8%)',
            top: '54%',
            maxWidth: '240px',
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #e8f4fd 100%)',
            border: '2px dashed rgba(26,167,236,0.45)',
            borderRadius: '16px',
            padding: '14px 18px',
            boxShadow: '0 8px 24px rgba(196,90,45,0.18), 0 2px 6px rgba(196,90,45,0.1)',
            fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/suai-avatar.jpg" alt="Sự AI" width={44} height={44} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', objectPosition: '50% 22%', border: '2px solid #1aa7ec' }} />
              <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#0f2a4a', fontWeight: 500 }}>
                Phát triển bởi <strong style={{ color: '#0f4c8a' }}>SỰ AI</strong><br />
                AI luận giải <strong style={{ color: '#c45a2d' }}>miễn phí</strong>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 上线公告便利贴 — 手机端正常流式显示（hero 内容下方居中） */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ delay: 1.4, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="lg:hidden mx-auto mt-8 mb-2 pointer-events-none"
          style={{
            maxWidth: 'min(280px, 84vw)',
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #e8f4fd 100%)',
            border: '2px dashed rgba(26,167,236,0.45)',
            borderRadius: '14px',
            padding: '12px 16px',
            boxShadow: '0 6px 18px rgba(196,90,45,0.16), 0 2px 4px rgba(196,90,45,0.08)',
            fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <img src="/suai-avatar.jpg" alt="Sự AI" width={38} height={38} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', objectPosition: '50% 22%', border: '2px solid #1aa7ec' }} />
              <div style={{ fontSize: '12px', lineHeight: 1.5, color: '#0f2a4a', fontWeight: 500, textAlign: 'left' }}>
                Phát triển bởi <strong style={{ color: '#0f4c8a' }}>SỰ AI</strong><br />
                AI luận giải <strong style={{ color: '#c45a2d' }}>miễn phí</strong>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 滚动提示（绝对定位，不影响 hero opacity 计算） */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none">
          <span className="text-[9px] tracking-[0.4em] uppercase" style={{ color: c.scrollText }}>Khám phá thêm</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-px h-8" style={{ background: `linear-gradient(to bottom, ${c.scrollLine}, transparent)` }} />
        </motion.div>
      </section>

      {/* ══ 哲学引言 ══════════════════════════════════════ */}
      <section className="relative z-10 overflow-hidden min-h-[82svh] lg:min-h-[92vh] flex items-center" style={{ padding: '72px 24px' }}>
        <WeakBoundary line={c.navBorder} />
        <div className="absolute inset-0"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(to bottom, #020810 0%, #020810 6%, #030a18 22%, #0d0820 40%, #0a0618 68%, #030a18 86%, #020810 100%)'
              : 'linear-gradient(to bottom, #f5efe0 0%, #f5efe0 6%, #c08055 18%, #6a2810 32%, #1e0a02 50%, #1e0a02 70%, #6a2810 84%, #f5efe0 100%)',
            transition: 'background 0.4s ease',
          }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="font-bold" style={{ fontSize: 'clamp(220px, 38vw, 460px)', color: 'rgba(212,168,67,0.012)', lineHeight: 1, fontFamily: 'serif' }}>命</span>
        </div>
        <FadeIn className="relative mx-auto text-center w-full" y={20}>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(212,168,67,0.45))' }} />
            <span className="text-[10px] tracking-[0.55em] uppercase" style={{ color: 'rgba(212,168,67,0.5)' }}>Mệnh · Vận · Quan</span>
            <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(212,168,67,0.45))' }} />
          </div>
          <div className="space-y-3" style={{ maxWidth: '840px', margin: '0 auto' }}>
            {[
              { text: 'Ý nghĩa của việc nhìn trước vận mệnh', size: 'clamp(17px, 2.2vw, 28px)', color: 'rgba(215,228,252,0.72)', delay: 0.1 },
              { text: 'không nằm ở việc biết trước tương lai', size: 'clamp(21px, 2.6vw, 32px)', color: 'rgba(220,232,250,0.74)', delay: 0.25 },
              { text: 'mà ở việc không ngừng hiểu rõ chính mình', size: 'clamp(24px, 3vw, 40px)', color: 'rgba(218,230,248,0.8)', delay: 0.34 },
            ].map((line, i) => (
              <motion.p key={i}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: line.delay }}
                className="tracking-wider" style={{ fontSize: line.size, color: line.color, fontWeight: 400 }}>
                {line.text}
              </motion.p>
            ))}
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold`}
              style={{ fontSize: 'clamp(24px, 3.4vw, 48px)', letterSpacing: '0.05em', lineHeight: 1.35 }}>
              để rồi tự viết nên kịch bản cuộc đời mình
            </motion.p>
          </div>
        </FadeIn>
      </section>

      {/* ══ 4 大学习板块时间轴 ════════════════════════════ */}
      <section className="relative z-10 py-20 lg:py-24 px-6"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, transparent 0%, rgba(184,146,42,0.03) 50%, transparent 100%)'
            : 'linear-gradient(to bottom, transparent 0%, rgba(184,146,42,0.04) 50%, transparent 100%)',
        }}>
        <FadeIn className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
            <span className="text-[10px] tracking-[0.4em] uppercase" style={{ color: c.goldSolid, opacity: 0.7 }}>Curriculum</span>
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
          </div>
          <div className="text-2xl lg:text-3xl font-bold mb-2 tracking-[0.15em]" style={{ color: c.textPrimary }}>
            Phương pháp thầy Nghê · mở dần từng phần
          </div>
          <div className="text-xs lg:text-sm tracking-[0.1em]" style={{ color: c.textMuted }}>
            Bắt đầu từ Tử Vi, dần mở Thiên Kỷ / Địa Kỷ / học phần Nhân Kỷ
          </div>
        </FadeIn>

        <div className="max-w-sm lg:max-w-5xl mx-auto relative">
          {/* 横向连接线（仅桌面）*/}
          <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5"
            style={{
              background: `linear-gradient(90deg, ${c.goldSolid} 0%, ${c.goldSolid} 25%, ${c.goldLine} 25%)`,
              opacity: 0.6,
            }} />

          {/* 纵向连接线（仅手机）—— 圆点贴在线上，做"地铁线路图"风格 */}
          <div className="lg:hidden absolute left-7 top-7 bottom-7 w-px -translate-x-1/2"
            style={{
              background: `linear-gradient(180deg, ${c.goldSolid} 0%, ${c.goldSolid} 22%, ${c.goldLine} 22%)`,
              opacity: 0.6,
            }} />

          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-4 lg:gap-4">
            {SECTIONS.map((s, i) => {
              const ready = s.status === 'ready';
              return (
                <motion.div key={s.key}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="relative flex flex-row lg:flex-col items-center lg:items-center text-left lg:text-center gap-4 lg:gap-0">
                  {/* 节点圆 */}
                  <div className="relative w-14 h-14 shrink-0 rounded-full flex items-center justify-center lg:mb-3"
                    style={{
                      background: ready
                        ? `linear-gradient(135deg, ${c.goldSolid} 0%, ${c.goldSolid}cc 100%)`
                        : (theme === 'dark' ? 'rgba(184,146,42,0.05)' : '#fdf8ee'),
                      border: ready ? 'none' : `2px dashed ${c.goldLine}`,
                      color: ready ? '#fff' : c.textMuted,
                      boxShadow: ready ? `0 4px 16px ${c.goldSolid}55` : 'none',
                    }}>
                    <span className="text-2xl">{s.icon}</span>
                    {ready && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
                        style={{ background: '#10b981', boxShadow: '0 2px 6px rgba(16,185,129,0.4)' }}>
                        ✓
                      </div>
                    )}
                  </div>
                  {/* 文字组：手机端右排单列；桌面端居中堆叠 */}
                  <div className="flex-1 lg:flex-none flex flex-col items-start lg:items-center min-w-0">
                    {/* 顶行：时间标签 + 板块名 + note（手机端 inline；桌面端依然分行） */}
                    <div className="flex items-baseline gap-2 lg:flex-col lg:gap-0 lg:mb-1">
                      <div className="text-[10px] tracking-[0.25em] lg:mb-1.5"
                        style={{ color: ready ? '#10b981' : c.textMuted, fontWeight: 500 }}>
                        {s.when}
                      </div>
                      <div className="text-base lg:text-xl font-semibold tracking-[0.15em]"
                        style={{ color: c.textPrimary }}>
                        {s.name}
                      </div>
                      {s.note && (
                        <div className="text-[9px] tracking-[0.15em] px-2 py-0.5 rounded-full lg:hidden"
                          style={{
                            color: c.goldSolid,
                            background: theme === 'dark' ? 'rgba(184,146,42,0.1)' : 'rgba(184,146,42,0.08)',
                            border: `1px solid ${c.goldLine}`,
                            opacity: 0.85,
                          }}>
                          {s.note}
                        </div>
                      )}
                    </div>
                    {/* 桌面专属 note（手机已在顶行 inline 展示）*/}
                    {s.note && (
                      <div className="hidden lg:block text-[9px] tracking-[0.15em] mb-1.5 px-2 py-0.5 rounded-full"
                        style={{
                          color: c.goldSolid,
                          background: theme === 'dark' ? 'rgba(184,146,42,0.1)' : 'rgba(184,146,42,0.08)',
                          border: `1px solid ${c.goldLine}`,
                          opacity: 0.85,
                        }}>
                        {s.note}
                      </div>
                    )}
                    {/* 简介 */}
                    <div className="text-[11px] lg:text-xs leading-relaxed lg:max-w-[200px] mt-0.5 lg:mt-0"
                      style={{ color: c.textSecond }}>
                      {s.desc}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ 功能详解 ══════════════════════════════════════ */}
      <section className="relative z-10">
        {FEATURES.map((feature, i) => (
          <div key={i}
            className={`flex items-center px-6 md:px-10 lg:px-14 py-20 md:py-24 ${i <= 2 ? 'min-h-[82svh] lg:min-h-[92vh]' : ''}`}
            style={{ background: i % 2 === 1 ? c.altSection : 'transparent' }}>
            <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
              <div className={`grid grid-cols-1 ${i % 2 === 0 ? 'lg:grid-cols-[0.45fr_0.55fr]' : 'lg:grid-cols-[0.55fr_0.45fr]'} gap-10 lg:gap-16 items-start ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                {/* 文字区 */}
                <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <FadeIn delay={0}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px w-8" style={{ background: c.goldLine }} />
                      <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>{feature.tag}</span>
                    </div>
                  </FadeIn>
                  <FadeIn delay={0.1}>
                    <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold leading-tight mb-5 tracking-tight`}
                      style={{
                        fontSize: i < 2 ? 'clamp(36px, 4vw, 56px)' : 'clamp(30px, 3.5vw, 48px)',
                        whiteSpace: 'pre-line',
                      }}>
                      {feature.title}
                    </h2>
                  </FadeIn>
                  <FadeIn delay={0.2}>
                    <p className="text-base mb-8 leading-relaxed" style={{ color: c.textSecond }}>{feature.subtitle}</p>
                  </FadeIn>
                  <div className="space-y-4">
                    {feature.points.map((point, j) => (
                      <FadeIn key={j} delay={0.25 + j * 0.08}>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-2 w-1 h-1 rounded-full" style={{ background: c.goldSolid, opacity: 0.6 }} />
                          <p className="text-sm leading-relaxed" style={{ color: c.textMuted }}>{point}</p>
                        </div>
                      </FadeIn>
                    ))}
                  </div>
                </div>
                {/* 视觉装饰区 */}
                <div className={i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <FadeIn delay={0.15}>
                    <div className="relative rounded-2xl overflow-hidden p-8 md:p-12"
                      style={{
                        border: `1px solid ${c.featureBord}`,
                        background: c.featureBg,
                        minHeight: i <= 1 ? '540px' : i === 2 ? '460px' : '320px',
                        boxShadow: c.cardShadow,
                      }}>
                      <FeatureVisual index={i} colors={c} />
                    </div>
                  </FadeIn>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ══ 天·地·人 三分理论 ════════════════════════════ */}
      <section className="relative z-10 flex items-center px-6 md:px-10 lg:px-14 py-20"
        style={{ background: c.altSection, minHeight: '82svh' }}>
        <WeakBoundary line={c.navBorder} />
        <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
          <FadeIn>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
                <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>Ni Haixia · Philosophy</span>
                <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
              </div>
              <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-5 tracking-tight`}
                style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
                Thiên · Địa · Nhân
              </h2>
              <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: c.textSecond }}>
                Quan niệm cốt lõi của thầy Nghê Hải Hạ: vận mệnh chưa bao giờ là toàn bộ cuộc đời.<br />
                Ông chia các lực ảnh hưởng đến đời người thành ba chiều quan trọng như nhau.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {[
              { glyph: 'Thiên', label: 'Vận mệnh bẩm sinh', pct: '⅓', color: c.goldSolid, borderColor: c.goldLine, desc: 'Tử Vi Đẩu Số cho thấy cách cục bẩm sinh của một người — bố cục các sao, Ngũ Hành Cục, chính tinh cung Mệnh do thời điểm sinh quyết định. Đó chỉ là một phần ba vận mệnh, là nền của cuộc đời chứ không phải toàn cảnh.', sub: 'Lá số · Tinh diệu · Ngũ hành' },
              { glyph: '地', label: 'Môi trường địa lý', pct: '⅓', color: 'rgba(96,165,250,0.9)', borderColor: 'rgba(96,165,250,0.3)', desc: 'Môi trường địa lý, thành phố, quốc gia, phong thủy, cho đến hoàn cảnh gia đình và xã hội tạo nên chiều thứ hai của vận mệnh. Cùng một lá số, sinh ở nơi khác nhau, cơ duyên có thể khác một trời một vực.', sub: 'Vùng đất · Phong thủy · Môi trường' },
              { glyph: 'Nhân', label: 'Ý niệm con người', pct: '⅓', color: 'rgba(100,216,139,0.9)', borderColor: 'rgba(100,216,139,0.3)', desc: 'Ý chí, tâm thế, lựa chọn và hành động của mỗi người mới là sức mạnh chủ động nhất để thay đổi vận mệnh. Thầy Nghê nhấn mạnh: hiểu lá số là để sống tốt hơn, không phải ngồi chờ số phận an bài. Không ngừng hoàn thiện bản thân là cách phá cục mạnh nhất.', sub: 'Ý chí · Lựa chọn · Hành động' },
            ].map((item, i) => (
              <FadeIn key={item.glyph} delay={0.1 + i * 0.12}>
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.1 }}
                  className="rounded-2xl p-7 h-full flex flex-col"
                  style={{ background: c.cardBg, border: `1px solid ${item.borderColor}`, boxShadow: c.cardShadow }}>
                  <div className="flex items-start justify-between mb-5">
                    <div className="text-5xl font-bold leading-none" style={{ color: item.color }}>{item.glyph}</div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: item.color }}>{item.pct}</div>
                      <div className="text-[9px] mt-0.5 tracking-widest" style={{ color: c.textMuted }}>of life</div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-sm font-medium mb-0.5" style={{ color: item.color }}>{item.label}</div>
                    <div className="text-[10px] tracking-wider" style={{ color: c.textMuted }}>{item.sub}</div>
                  </div>
                  <div className="h-px mb-4" style={{ background: item.borderColor }} />
                  <p className="text-xs leading-relaxed flex-1" style={{ color: c.textSecond }}>{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <div className="mt-10 text-center">
              <p className="text-sm leading-relaxed" style={{ color: c.textSecond }}>
                “Vận mệnh không phải toàn bộ cuộc đời; cộng thêm địa lý và ý niệm con người mới là đủ.”
              </p>
              <p className="mt-2 text-[10px] tracking-widest" style={{ color: c.tagText }}>— 倪海厦</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ 倪海厦介绍 ════════════════════════════════════ */}
      <section className="relative z-10 flex items-center px-6 md:px-10 lg:px-14 py-20" style={{ minHeight: '82svh' }}>
        <WeakBoundary line={c.navBorder} />
        <div className="mx-auto w-full" style={{ maxWidth: '1280px' }}>
          <FadeIn>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
                <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>Master · 1953 – 2012</span>
                <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
              </div>
              <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-6 tracking-tight`}
                style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
                Thầy Nghê Hải Hạ
              </h2>
              <p className="max-w-2xl mx-auto leading-relaxed text-sm" style={{ color: c.textSecond }}>
                Một trong những bậc thầy Đông y và thuật số có ảnh hưởng nhất giới Hoa ngữ đương đại<br />
                Người sáng lập Học viện Đông y Hán Đường (Mỹ) · để lại hai hệ giảng dạy “Nhân Kỷ” và “Thiên Kỷ”
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-2xl p-8 md:p-10 mb-8"
              style={{ border: `1px solid ${c.niBorder}`, background: c.niBg, boxShadow: c.cardShadow }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Sinh', value: '1954年', sub: 'Đài Loan' },
                  { label: 'Mất', value: '2012年', sub: '31/1 · hưởng thọ 58' },
                  { label: 'Truyền thừa', value: '紫微斗数', sub: 'Đông y Kinh phương · Kinh Dịch' },
                ].map(item => (
                  <div key={item.label} className="text-center rounded-xl px-4 py-3"
                    style={{ border: `1px solid ${c.niDivider}`, background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-[10px] tracking-[0.3em] mb-1" style={{ color: c.textFaint }}>{item.label}</div>
                    <div className="text-2xl font-semibold mb-0.5" style={{ color: c.goldSolid }}>{item.value}</div>
                    <div className="text-[11px]" style={{ color: c.textMuted }}>{item.sub}</div>
                  </div>
                ))}
              </div>
              <div className="h-px mb-8" style={{ background: c.niDivider }} />
              <div className="space-y-4 text-sm leading-relaxed max-w-3xl mx-auto" style={{ color: c.textSecond }}>
                <p>
                  <strong style={{ color: c.goldSolid }}>Tiểu sử</strong>：
                  Ông Nghê Hải Hạ (1954–2012) sinh tại Đài Loan, thuở nhỏ theo học nhiều danh y, chuyên nghiên cứu phái Kinh phương (truyền thừa “Thương Hàn Luận”).
                  Trung niên sang Mỹ hành nghề, sáng lập<strong>Học viện Đông y Hán Đường</strong>, hơn hai mươi năm truyền dạy có hệ thống Đông y và thuật số truyền thống.
                  Ông mất ngày 31/1/2012 tại Đài Loan vì ung thư gan, hưởng thọ 58 tuổi.
                </p>
                <p>
                  <strong style={{ color: c.goldSolid }}>Hệ thống giảng dạy</strong>：
                  Thầy Nghê hệ thống hóa sở học cả đời thành hai loạt bài giảng công khai.
                  <strong>“Nhân Kỷ”</strong>gồm “Châm Cứu Đại Thành”, “Thần Nông Bản Thảo Kinh”, “Hoàng Đế Nội Kinh”, “Thương Hàn Luận”, “Kim Quỹ Yếu Lược” —
                  đây là “kỷ của người”, đặt nền con đường học Đông y hoàn chỉnh;
                  <strong>“Thiên Kỷ”</strong>gồm Tử Vi Đẩu Số và “Kinh Dịch” — đây là “kỷ của trời”, thành quả hệ thống hóa nghiên cứu thuật số.
                  Hai phần hợp lại là truyền thừa hoàn chỉnh nhất thầy Nghê để lại cho hậu thế.
                </p>
                <p>
                  <strong style={{ color: c.goldSolid }}>Quan điểm Tử Vi</strong>：
                  Về Tử Vi Đẩu Số, thầy Nghê thuộc<strong>phái Tam Hợp phương Nam</strong>, chủ trương “lấy cung Mệnh làm gốc, Tam phương tứ chính làm dụng, Tứ Hóa làm cương”.
                  Trong khóa “Thiên Kỷ” ông nói rõ: “<em>Phi tinh (Tứ Hóa) bay qua bay lại quá phức tạp, không theo cái đó, vì đại đạo chí giản</em>」——
                  Quan điểm này phân biệt rõ ông với phái Phi Tinh rườm rà.
                </p>
                <p>
                  <strong style={{ color: c.goldSolid }}>Thái độ học thuật</strong>：
                  Thầy Nghê phản đối học vẹt khẩu quyết, nhấn mạnh “hiểu nguyên lý hơn học thuộc”, “logic kiểm chứng được hơn huyền học thần bí”.
                  Thái độ này đưa Tử Vi Đẩu Số từ hệ bí truyền thầy – trò khép kín thành hệ tri thức hiện đại có hệ thống, kiểm chứng được và học được.
                </p>
                <p>
                  <strong style={{ color: c.goldSolid }}>Ảnh hưởng đương đại</strong>：
                  Video bài giảng của thầy Nghê lan truyền rộng trên Bilibili, YouTube và nhiều nền tảng khác, là bài nhập môn bắt buộc của thế hệ mới yêu mệnh lý và Đông y.
                  Ông không chỉ là người truyền thừa Tử Vi Đẩu Số mà còn là nhân vật then chốt đưa mệnh lý truyền thống và Đông y vào hệ tri thức hiện đại.
                </p>
                <p style={{ fontSize: '11px', color: c.textMuted, fontStyle: 'italic', marginTop: '12px' }}>
                  Nội dung luận giải dựa trên bài giảng công khai “Thiên Kỷ” của thầy Nghê, “Tử Vi Đẩu Số Toàn Thư” bản đời Minh và cổ thư phái Tam Hợp,
                  chỉ mang tính tham khảo văn hóa và phát triển bản thân. Thầy Nghê không có liên hệ thương mại nào với trang này.
                </p>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NI_TEACHINGS.map((teaching, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.08}>
                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.1 }}
                  className="rounded-xl p-6 h-full"
                  style={{ border: `1px solid ${c.niCardBord}`, background: c.niCardBg, boxShadow: c.niCardShadow }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5"
                      style={{ borderColor: c.goldLine }}>
                      <span className="text-[9px]" style={{ color: c.goldSolid }}>{i + 1}</span>
                    </div>
                    <h3 className="text-sm font-medium leading-relaxed" style={{ color: c.goldSolid }}>{teaching.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed pl-8" style={{ color: c.textSecond }}>{teaching.body}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 合盘入口 ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-10 lg:px-14 py-20">
        <div className="mx-auto" style={{ maxWidth: '1280px' }}>
          <div className="rounded-2xl p-10 md:p-14 text-center"
            style={{
              background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
              border: `1px solid ${c.cardBorder}`,
              boxShadow: c.cardShadow,
            }}>
            <FadeIn>
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-8" style={{ background: c.goldLine }} />
                <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>Compatibility · Analysis</span>
                <div className="h-px w-8" style={{ background: c.goldLine }} />
              </div>
              <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-4 tracking-tight`}
                style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}>
                Hợp lá số Tử Vi
              </h2>
              <p className="text-sm leading-relaxed mb-8 max-w-lg mx-auto" style={{ color: c.textSecond }}>
                Nhập thông tin ngày sinh của hai người, AI AI phân tích cung Phu Thê đối chiếu, độ tương hợp cung Mệnh và tương tác Tam phương tứ chính,<br className="hidden md:block" />
                đưa ra mức độ hợp tình cảm, khả năng hợp tác và lời khuyên chung sống.
              </p>
              <div className="flex justify-center gap-3 flex-wrap mb-6">
                {['Phân tích hợp tình cảm', 'Đánh giá hợp tác làm ăn', 'Duyên cha mẹ – con cái', 'Đánh giá hợp trước hôn nhân'].map(item => (
                  <span key={item} style={{
                    fontSize: '12px', padding: '5px 14px', borderRadius: '20px',
                    background: theme === 'dark' ? 'rgba(212,168,67,0.08)' : 'rgba(212,168,67,0.12)',
                    border: `1px solid ${c.goldLine}`,
                    color: c.goldSolid,
                  }}>
                    {item}
                  </span>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/heming')}
                className="px-10 py-3 font-medium text-sm tracking-widest rounded-full"
                style={{
                  background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(140,100,20,0.1)',
                  border: `1px solid ${c.goldLine}`,
                  color: c.goldSolid,
                  cursor: 'pointer',
                }}>
                Bắt đầu xem hợp
              </motion.button>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══ 最终 CTA ══════════════════════════════════════ */}
      <section className="relative z-10 py-40 px-6 text-center" style={{ background: c.altSection }}>
        <FadeIn>
          <p className="text-[10px] tracking-[0.6em] uppercase mb-6" style={{ color: c.tagText }}>Bắt đầu hành trình lá số của bạn</p>
          <h2 className={`grad-text ${theme === 'dark' ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-8 tracking-tight leading-tight`}
            style={{ fontSize: 'clamp(32px, 5vw, 60px)' }}>
            Lá số Tử Vi của bạn<br />đang chờ được luận giải
          </h2>
          <p className="text-sm mb-10 max-w-md mx-auto leading-relaxed" style={{ color: c.textSecond }}>
            Nhập ngày giờ sinh, vài giây là có lá số của riêng bạn<br />
            rồi để AI luận giải sâu cho bạn bằng tiếng Việt
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/chart')}
            className="px-14 py-4 font-semibold text-base tracking-widest rounded-full"
            style={{ background: c.ctaBg, color: c.ctaText }}>
            Lập lá số miễn phí
          </motion.button>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <motion.a
              href="/knowledge"
              whileHover={{ scale: 1.02 }}
              className="text-xs tracking-[0.2em] inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                color: c.goldSolid,
                border: `1px solid ${c.goldLine}`,
                background: 'transparent',
                textDecoration: 'none',
              }}>
              ✦ Kho kiến thức Tử Vi Đẩu Số →
            </motion.a>
            <motion.a
              href="/library"
              whileHover={{ scale: 1.02 }}
              className="text-xs tracking-[0.2em] inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                color: c.goldSolid,
                border: `1px solid ${c.goldLine}`,
                background: 'transparent',
                textDecoration: 'none',
              }}>
              📜 Kho cổ thư →
            </motion.a>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 px-6"
        style={{ borderTop: `1px solid ${c.niCardBord}` }}>

        {/* 4 板块导航占位（已上线 + 即将开放）*/}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-[9px] tracking-[0.3em] text-center mb-4 uppercase"
            style={{ color: c.textMuted, opacity: 0.6 }}>
            Phương pháp thầy Nghê · Hệ học thuật
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {SECTIONS.map(s => {
              const ready = s.status === 'ready';
              return (
                <a
                  key={s.key}
                  href={ready ? '/chart' : undefined}
                  onClick={ready ? undefined : (e) => e.preventDefault()}
                  className="rounded-lg px-3 py-3 text-center transition-all"
                  style={{
                    background: ready ? c.starBg : 'transparent',
                    border: `1px ${ready ? 'solid' : 'dashed'} ${ready ? c.goldLine : c.navBorder}`,
                    cursor: ready ? 'pointer' : 'not-allowed',
                    opacity: ready ? 1 : 0.5,
                    textDecoration: 'none',
                  }}
                >
                  <div className="text-base font-semibold mb-0.5 tracking-[0.1em]"
                    style={{ color: ready ? c.goldSolid : c.textMuted }}>
                    {s.name}
                  </div>
                  <div className="text-[9px] tracking-wider"
                    style={{ color: ready ? '#10b981' : c.textMuted }}>
                    {ready ? '✓ Đã ra mắt' : `${s.when} mở`}
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] tracking-wider mb-3" style={{ color: c.footerText }}>
            Tử Vi Sự AI · Theo hệ Nghê Hải Hạ · Chỉ để tham khảo, vận mệnh nằm trong tay bạn
          </p>
          <p className="text-[10px] tracking-wider mb-3 max-w-2xl mx-auto leading-relaxed"
            style={{ color: c.footerText, opacity: 0.85 }}>
            Trang dựa trên nghiên cứu văn hóa truyền thống phương Đông, chỉ để học tập và tham khảo.<br className="sm:hidden" />
            Không phải lời khuyên y tế, đầu tư, pháp lý hay quyết định quan trọng.
          </p>
          <p className="text-[10px] tracking-wider" style={{ color: c.footerText }}>
            <a href="/terms" style={{ color: c.footerText, textDecoration: 'underline' }}>Điều khoản</a>
            {' · '}
            <a href="/privacy" style={{ color: c.footerText, textDecoration: 'underline' }}>Quyền riêng tư</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
