'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { Star } from '@/lib/ziwei/types';
import { STAR_DESCRIPTIONS } from '@/lib/ziwei/constants';

interface StarDetailPanelProps {
  star: Star | null;
  palaceName?: string;
  onClose: () => void;
}

// 倪海厦体系各星详细解读（参考顾祥弘《飞星紫微斗数全书》及南北山人《紫微斗数全书》）
const STAR_DETAIL: Record<string, {
  niHaixia: string;
  classical: string;
  bestPalace: string;
  worstPalace: string;
  career: string;
  relationship: string;
  wealth: string;
  health: string;
}> = {
  '紫微': {
    niHaixia: 'Thầy Nghê cho rằng Tử Vi là sao hoàng đế, người tọa Mệnh có khí cô ngạo, thích một mình, không thích bị quản. Tử Vi cần Tả Phù Hữu Bật giáp mới phát huy khí chất đế vương, nếu không chỉ là cô quân, giàu mà không sang. Tử Vi ở Thìn Tuất là đẹp nhất, cùng Thiên Phủ thành song tinh, tài quan song mỹ, có thể xuất tướng nhập tướng. Tử Vi sợ nhất Hỏa Tinh, Linh Tinh, Kình Dương, Đà La đồng cung; thêm sát thì cô quý, có quyền mà không có tiền.',
    classical: 'Cổ quyết: “Tử Vi đế tọa lâm Mệnh chủ tôn quý, thống lĩnh các sao, tọa Mệnh chủ quyền uy hiển đạt.” Nam Bắc Sơn Nhân chú: “Tử Vi thủ Mệnh ở Thìn, tài quan song mỹ, xuất tướng nhập tướng, quan đến tam công; an Mệnh ở Tý thì phú quý không bền, về sau không đẹp.”',
    bestPalace: '命宫（辰戌）、官禄宫',
    worstPalace: '疾厄宫、夫妻宫',
    career: 'Chính trường, quản lý cấp cao, tự khởi nghiệp; khí chất đế vương bẩm sinh, hợp vị trí lãnh đạo một mình gánh vác',
    relationship: 'Tình cảm bị động, tự trọng cao, cần đối phương chủ động, có xu hướng cô độc, kết hôn muộn thì tốt',
    wealth: 'Tài vận ổn định, giữ của giỏi hơn tiến thủ; ở Thìn Tuất tài quan song mỹ, hợp nhất đầu tư tích lũy',
    health: 'Thuộc Thổ, chú ý tỳ vị, hệ tiêu hóa. Tránh làm việc quá sức, nên sinh hoạt điều độ',
  },
  '天机': {
    niHaixia: 'Thầy Nghê nói Thiên Cơ là sao tham mưu, thông minh nhất, nhưng khôn lộ ra ngoài thì hại thân. Thiên Cơ Hóa Kỵ phiền nhất, ứng câu khôn quá hóa dại. Thiên Cơ thuộc Mộc, linh động hay biến, ở Mệnh thì tư duy nhanh nhạy nhưng thường nhiều mưu ít quyết, cần rời quê đi xa mới phát triển; tùy cơ ứng biến là đặc tính lớn nhất.',
    classical: 'Cổ quyết: “Người tinh khôn, thích kinh doanh; Thiên Cơ thuộc Mộc, buôn bán nhiều cơ mưu, xa tổ ắt xa thân.” Nam Bắc Sơn Nhân chú: “Thiên Cơ ở đất Miếu Vượng chủ người tinh minh, giỏi hoạch định; ở đất Hãm thì ảm đạm, phần nhiều theo nghề buôn.”',
    bestPalace: 'Mệnh (cung Mão), Quan Lộc',
    worstPalace: '夫妻宫',
    career: 'Chuyên gia kỹ thuật, quân sư, nhà nghiên cứu, IT , lập kế hoạch; dùng đầu óc hơn tay chân, hợp phát triển xa quê',
    relationship: 'Tình cảm hay thay đổi, suy nghĩ quá nhiều, khó chuyên nhất; nên kết hôn muộn, sau cưới cần học buông bớt lo nghĩ',
    wealth: 'Kiếm tiền bằng trí tuệ và kỹ năng, không giỏi giữ của; theo nghề chuyên môn kỹ thuật thì tài vận ổn định',
    health: 'Thuộc Mộc, chú ý gan mật, hệ thần kinh. Nghĩ nhiều dễ mất ngủ, nên tập tĩnh tâm, thiền',
  },
  '太阳': {
    niHaixia: 'Thầy Nghê cho rằng Thái Dương là sao gia trưởng, từ Mão đến Ngọ nhập Miếu, quang minh chính đại; sau Ngọ dần hãm. Người Thái Dương tọa Mệnh hào phóng, trọng thể diện; nam mệnh hợp, nữ mệnh quá mạnh. Thái Dương đại diện cha và bề trên; ở Mệnh chủ tính hướng ngoại, cởi mở, thích được chú ý, hợp nhất công chức hoặc sự nghiệp công chúng. Hãm địa thì trước siêng sau lười, cô quả lao lực.',
    classical: 'Cổ quyết: “Thái Dương ở Ngọ là nhập Miếu, ánh sáng rực rỡ, chủ quý hiển, nam mệnh đẹp nhất; hãm thì cô quả lao lực, trước siêng sau lười.” Nam Bắc Sơn Nhân chú: “Thái Dương thủ Mệnh ở Ngọ, tài quan song mỹ, xuất tướng nhập tướng; an Mệnh ở Thìn, trung niên tài quan tốt lên, người sinh năm Ất gặp hung cũng đại lợi.”',
    bestPalace: 'Mệnh (Mão đến Ngọ), Quan Lộc',
    worstPalace: '夫妻宫（女命）、疾厄宫',
    career: 'Công chức, chính trường, quản lý, PR, giáo dục, truyền thông; thích đứng trước đám đông, hợp sự nghiệp công chúng',
    relationship: 'Nam mệnh có duyên nhưng đa tình, nữ mệnh độc lập mạnh mẽ; hôn nhân cần dung hòa, nên tìm bạn đời dịu dàng chu đáo',
    wealth: 'Tài lộc nhờ nỗ lực, hào phóng hay cho, không giỏi tích lũy; nhập Miếu tài vượng, hãm địa thì lên xuống',
    health: 'Thuộc Hỏa, chú ý tim, mắt. Khi hãm địa dễ quá sức, cần nghỉ ngơi đầy đủ',
  },
  '武曲': {
    niHaixia: 'Thầy Nghê coi Vũ Khúc là chủ tinh Tài Bạch, cứng rắn không khuất, sợ nhất cô khắc. Người Vũ Khúc tọa Mệnh ý chí kiên định, hợp tài chính, quản lý tiền, nhưng tình cảm quá thẳng, dễ làm tổn thương người khác. Vũ Khúc Hóa Kỵ phải cẩn thận tai nạn đổ máu. Vũ Khúc ở Thìn Tuất Sửu Mùi đắc vượng địa, cùng Thất Sát đồng cung thành cách Tướng Tài, là cách cục tài phú rất tốt.',
    classical: 'Cổ quyết: “Vũ Khúc thuộc Kim, tính cương cường, một đời nhiều hình khắc; thủ Mệnh ở vượng địa thì xuất tướng nhập tướng.” Nam Bắc Sơn Nhân chú: “Vũ Khúc thủ Mệnh, Tam phương tứ chính đều cát, tài quan song mỹ; võ chức thêm Phụ Bật Xương Khúc cũng chủ đại quý; cùng Thất Sát đồng cung là cách Tướng Tài, chủ đại phú.”',
    bestPalace: '命宫（辰戌丑未）、财帛宫、官禄宫',
    worstPalace: '夫妻宫',
    career: 'Tài chính, quân đội – công an, kế toán, kỹ thuật; năng lực thực thi rất mạnh, hợp lĩnh vực cần khí phách và quyết đoán',
    relationship: 'Tình cảm thẳng thắn, thiếu lãng mạn, cần bạn đời dịu dàng bù trừ, kỵ cô khắc trong tình cảm',
    wealth: 'Bản mệnh là tài tinh, tài vận rất mạnh, quản lý tiền giỏi vượt trội; ở Thìn Tuất tài quan song mỹ',
    health: 'Thuộc Kim, chú ý phổi, hệ hô hấp, răng. Khi Hóa Kỵ cần phòng tai nạn đổ máu',
  },
  '天同': {
    niHaixia: 'Thầy Nghê nói Thiên Đồng là phúc tinh, cũng là sao lười nhất. Thiên Đồng tọa Mệnh thích hưởng phúc, không thích cạnh tranh, hợp công việc ổn định. Thiên Đồng cùng Thiên Lương đồng cung là tốt nhất, vừa hưởng phúc vừa có bảo đảm. Thiên Đồng Hóa Lộc là Hóa Lộc đẹp nhất, chủ cả đời no đủ, vui vẻ thong dong. Thiên Đồng kỵ hãm địa, hãm thì phúc giảm, cần hóa giải hung tinh.',
    classical: 'Cổ quyết: “Thiên Đồng là sao phúc đức, tọa Mệnh hưởng phúc có dư, cả đời tiêu dao tự tại, không phải lao khổ.” Nam Bắc Sơn Nhân chú: “Thiên Đồng thủ Mệnh, Tam phương không sát, cả đời vui vẻ, cơm áo đầy đủ; thêm cát tinh thì phú quý song toàn, tính ôn hòa, nhiều nhân duyên.”',
    bestPalace: '命宫、福德宫',
    worstPalace: '官禄宫',
    career: 'Dịch vụ, giải trí, ẩm thực, văn nghệ; hợp nhất môi trường thoải mái, kỵ áp lực cạnh tranh cao',
    relationship: 'Tình cảm ôn hòa, không chủ động, dễ bị động đón nhận; hôn nhân khá ổn định, tính dễ gần',
    wealth: 'Tài vận không nổi bật, dựa vào lương ổn định, không giỏi đầu cơ; no đủ nhưng khó đại phú',
    health: 'Thuộc Thủy, chú ý thận, bàng quang. Thể chất hơi yếu, nên vận động vừa phải, giữ tinh thần thoải mái',
  },
  '廉贞': {
    niHaixia: 'Thầy Nghê cho rằng Liêm Trinh là thứ đào hoa, tài hoa tràn đầy nhưng tình cảm phức tạp. Liêm Trinh Hóa Kỵ rất hung, chủ kiện tụng, tù tội, tai nạn. Liêm Trinh cùng Thiên Tướng đồng cung thì hóa hung thành cát, thành cách hành chính ấn thụ. Liêm Trinh ngũ hành thuộc Hỏa, tính cương liệt, đời nhiều thăng trầm, tài nghệ xuất chúng; nếu giữ chính không tà thì thành đại khí.',
    classical: 'Cổ quyết: “Liêm Trinh là thứ đào hoa, tài hoa tràn đầy, tình cảm nhiều sóng gió; Liêm Tướng đồng cung hóa hung thành cát, thành cách hành chính ấn thụ, có thể nắm quyền.” Nam Bắc Sơn Nhân chú: “Liêm Trinh thủ Mệnh, gặp cát tinh thì tài hoa xuất chúng; Hóa Kỵ thì kiện tụng bám thân, chủ tai họa đổ máu, phải phòng.”',
    bestPalace: 'Quan Lộc (đi cùng Thiên Tướng), Mệnh (khi Hóa Lộc)',
    worstPalace: 'Mệnh (khi Hóa Kỵ), Phu Thê',
    career: 'Nghệ thuật, giải trí, pháp luật, công chức (đi cùng Thiên Tướng); tài nghệ xuất chúng, giữ nghề chính mới bền',
    relationship: 'Đào hoa nhiều, tình cảm phức tạp, dễ vướng rắc rối tình cảm; nên kết hôn muộn, chọn người điềm đạm',
    wealth: 'Tài vận lên xuống, kiếm tiền bằng tài nghệ; khi Hóa Kỵ phòng tranh chấp tài chính và rủi ro pháp lý',
    health: 'Thuộc Hỏa, chú ý tim, máu, gan. Khi Hóa Kỵ phòng tai nạn, phẫu thuật, đổ máu',
  },
  '天府': {
    niHaixia: 'Thầy Nghê nói Thiên Phủ là sao kho tài, sao thủ thành, không chủ động phát tài nhưng giữ được của. Người Thiên Phủ tọa Mệnh điềm đạm thận trọng, nữ mệnh đẹp nhất, vượng phu hưng gia. Thiên Phủ thích nhất Tử Vi đồng cung hoặc xung chiếu, thành song tinh, tài quan song mỹ. Thiên Phủ sợ Không Kiếp giáp; gặp Không Kiếp thì kho tài cạn, không giữ được của.',
    classical: 'Cổ quyết: “Thiên Phủ là sao kho tài, thủ Mệnh thì điềm đạm thận trọng, chủ tích của vượng nhà; nữ mệnh gặp thì vượng phu ích tử, gia đạo hưng long.” Nam Bắc Sơn Nhân chú: “Thiên Phủ thủ Mệnh, Tam phương hội cát, tài quan song mỹ, phú quý an khang; gặp Không Kiếp thì kho tài thủng, khó tích của.”',
    bestPalace: '命宫、财帛宫、田宅宫',
    worstPalace: '迁移宫',
    career: 'Quản lý hành chính, tài chính, bảo hiểm, bất động sản; cầu ổn không mạo hiểm, hợp nghề thủ thành',
    relationship: 'Tình cảm ổn định, chăm lo gia đình, là bạn đời tốt, coi trọng an toàn gia đình và bảo đảm kinh tế',
    wealth: 'Tài vận rất tốt, giữ của giỏi, hợp nhất đầu tư tích lũy và mua bất động sản',
    health: 'Thuộc Thổ, chú ý tỳ vị, tiêu hóa. Thể chất vững, nên ăn uống sinh hoạt điều độ',
  },
  '太阴': {
    niHaixia: 'Thầy Nghê cho rằng Thái Âm là tài tinh, lợi nữ mệnh, cũng là sao đại diện mẹ và vợ của nam mệnh. Thái Âm nhập Miếu thì tài vận rất tốt, hãm địa thì tài vận bị cản. Thái Âm Hóa Kỵ cần chú ý chuyện của người thân nữ. Thái Âm ở Hợi Tý nhập Miếu, sáng rỡ, chủ thanh lịch tinh tế, tình cảm phong phú, coi trọng thế giới nội tâm và đời sống tinh thần.',
    classical: 'Cổ quyết: “Thái Âm là tài tinh, lợi nữ mệnh; ở Hợi Tý nhập Miếu, sáng rỡ, tài vận rất vượng; ở Ngọ hãm địa, u buồn đa tình, tài vận bình thường.” Nam Bắc Sơn Nhân chú: “Thái Âm thủ Mệnh, nhập Miếu thì giàu có, nữ mệnh càng đẹp; hãm địa phải nỗ lực mới giàu, tình cảm tinh tế.”',
    bestPalace: '命宫（亥子）、财帛宫',
    worstPalace: 'Mệnh (cung Ngọ, hãm địa)',
    career: 'Tài chính, ngân hàng, bất động sản, nghệ thuật, giáo dục; tinh tế kiên nhẫn, hợp nghề cần thẩm mỹ và sự dịu dàng',
    relationship: 'Tình cảm dịu dàng tinh tế, coi trọng cảm xúc nội tâm, cần mối quan hệ ổn định, an toàn',
    wealth: 'Nhập Miếu tài vận rất vượng, hãm thì cần nỗ lực; quản lý tiền cẩn thận, giỏi tích lũy, không giỏi mạo hiểm',
    health: 'Thuộc Thủy, chú ý thận, tử cung (nữ mệnh). Cảm xúc dao động ảnh hưởng sức khỏe, nên giữ tâm trạng thoải mái',
  },
  '贪狼': {
    niHaixia: 'Thầy Nghê nói Tham Lang là sao đa tài đa nghệ nhất, đào hoa nặng nhất. Tham Lang Hóa Lộc nhập Mệnh thì sức hút tỏa khắp, ai gặp cũng mến. Tham Lang là sao phát muộn, sau trung niên mới thật sự phát đạt. Tham Lang ở Dần Thân nhập Miếu là đẹp nhất, đào hoa vượng, tài nghệ vượt trội; Hóa Lộc thì tài vận đại phát, nhưng gặp Không Kiếp thì đời nhiều trắc trở, khó tụ tài.',
    classical: 'Cổ quyết: “Tham Lang phát phúc hanh thông, đa tài đa nghệ, đào hoa nặng nhất; nhưng khó qua tuổi ba mươi, phần nhiều phát muộn. Hãm địa gặp sát lại thành tốt, đó là lý của Tham Lang hãm địa.” Nam Bắc Sơn Nhân chú: “Tham Lang thủ Mệnh, gặp cát thì phúc lộc thọ, phát phúc hanh thông; nhưng lâu dài khó trọn vẹn, nên tu thân dưỡng đức mới được an lành.”',
    bestPalace: '命宫（化禄）、福德宫、迁移宫',
    worstPalace: '疾厄宫',
    career: 'Nghệ thuật, giải trí, PR, bán hàng, phong thủy – ngũ thuật; dựa vào quan hệ và tài nghệ, kiểu người đa tài',
    relationship: 'Đào hoa rất vượng, tình cảm đa dạng; nên kết hôn muộn, sau cưới cần tiết chế đào hoa mới bạc đầu',
    wealth: 'Kiếm tiền nhờ quan hệ và tài nghệ, tài vận trung – vãn niên mới ổn; Hóa Lộc thì nguồn tiền rộng mở, thời trẻ nên giữ vững',
    health: 'Thuộc Mộc (kiêm Thủy), chú ý gan, thận. Đào hoa quá vượng dễ hao tổn sức lực, nên tiết chế điều dưỡng',
  },
  '巨门': {
    niHaixia: 'Thầy Nghê cho rằng Cự Môn là sao khẩu thiệt thị phi, nhưng Hóa Lộc, Hóa Quyền thì chuyển tốt, thành cách kiếm tiền bằng khẩu tài. Cự Môn tọa Mệnh đa nghi, giỏi biện luận, hợp luật sư, giáo viên, bán hàng. Cự Môn kỵ nhất Hóa Kỵ, chủ thị phi không dứt, thậm chí kiện tụng. Cự Môn ở Tý Ngọ khá đẹp, ăn nói giỏi, lập thân bằng lời nói.',
    classical: 'Cổ quyết: “Cự Môn là ám diệu, chủ khẩu thiệt thị phi; Hóa Lộc Quyền thì chuyển sang mưu sinh bằng khẩu tài, chủ phú quý.” Nam Bắc Sơn Nhân chú: “Cự Môn thủ Mệnh, gặp Hóa Lộc Quyền, làm nghề bằng miệng thì đại cát; Hóa Kỵ thì miệng lưỡi liên lụy, kiện tụng bám thân, phải thận trọng lời nói.”',
    bestPalace: '官禄宫（化禄权）、命宫（子午）',
    worstPalace: '夫妻宫、疾厄宫（化忌）',
    career: 'Luật sư, giáo viên, bán hàng, MC, chuyên gia đàm phán; khẩu tài là năng lực cạnh tranh cốt lõi',
    relationship: 'Đa nghi đa lo, dễ nghĩ nhiều; giao tiếp là chìa khóa hôn nhân, cần chọn bạn đời kiên nhẫn',
    wealth: 'Kiếm tiền nhờ khẩu tài và chuyên môn; Hóa Lộc thì tài vận khá, Hóa Kỵ phòng tranh chấp tiền bạc, liên lụy lời nói',
    health: 'Thuộc Thủy, chú ý thận, tai, khoang miệng. Lo nghĩ nhiều dễ hại thân, nên học cách thư giãn giảm áp lực',
  },
  '天相': {
    niHaixia: 'Thầy Nghê nói Thiên Tướng là sao ấn thụ, lo việc hành chính. Người Thiên Tướng tọa Mệnh mực thước, hợp công chức hành chính. Thiên Tướng cần sao mạnh đi kèm mới phát huy, một mình tọa Mệnh khá bình thường. Thiên Tướng thích nhất Liêm Trinh đi cùng thành cách Liêm Tướng, chủ quyền hành chính lớn; sợ nhất Phá Quân đồng cung thành cách Hình Kỵ giáp Ấn, chủ hung hiểm.',
    classical: 'Cổ quyết: “Thiên Tướng là sao ấn thụ, chủ việc hành chính; Liêm Tướng đồng cung hóa hung thành cát, nắm quyền hành chính lớn.” Nam Bắc Sơn Nhân chú: “Thiên Tướng thủ Mệnh, mực thước, hợp công chức; được Liêm Trinh đi cùng có thể thành rường cột; Phá Quân cùng thủ thì khó tránh hình khắc.”',
    bestPalace: 'Quan Lộc, Mệnh (đi cùng Liêm Trinh)',
    worstPalace: 'Tài Bạch, Mệnh (đi cùng Phá Quân thành Hình Kỵ giáp Ấn)',
    career: 'Công chức, quản lý hành chính, thư ký, trợ lý; giỏi vai trò hỗ trợ, cần sao mạnh dẫn đường',
    relationship: 'Tình cảm ổn định, trung hậu thật thà, là bạn đời tốt nhưng cần đối phương định hướng',
    wealth: 'Tài vận bình ổn, tích lũy từ lương, không hợp đầu tư mạo hiểm, hợp nhất quản lý tiền kiểu thủ thành',
    health: 'Thuộc Thủy, chú ý thận, hệ bạch huyết. Thể chất trung bình, nên giữ nếp sinh hoạt điều độ',
  },
  '天梁': {
    niHaixia: 'Thầy Nghê cho rằng Thiên Lương là ấm tinh, che chở người khác, cũng đại diện y dược, tôn giáo. Người Thiên Lương tọa Mệnh có duyên với bề trên, thời trẻ nhiều gian nan, về già hưởng phúc. Thiên Lương sợ nhất Hóa Kỵ, chủ bề trên hoặc sức khỏe có vấn đề. Thiên Lương cùng Thái Dương đồng cung là đẹp nhất, nhật nguyệt tịnh minh, quý nhân che chở, cả đời có quý nhân giúp, cuối cùng bình an.',
    classical: 'Cổ quyết: “Thiên Lương là ấm tinh, chủ che chở bảo vệ; tọa Mệnh có duyên bề trên, thời trẻ chịu rèn luyện, về già hưởng thanh phúc.” Nam Bắc Sơn Nhân chú: “Thiên Lương thủ Mệnh phải gặp cát tinh mới phát đạt; gặp Thái Dương đồng cung, nhật nguyệt tịnh minh, chủ quý hiển, cả đời nhiều quý nhân giúp đỡ.”',
    bestPalace: '命宫、父母宫、福德宫',
    worstPalace: 'Mệnh (khi Hóa Kỵ), Tài Bạch',
    career: 'Y tế, tôn giáo, pháp luật, công tác xã hội, từ thiện; thích giúp người, có tâm che chở mọi người',
    relationship: 'Tình cảm thường với người chênh lệch tuổi nhiều, hoặc duyên đến muộn; cần kiên nhẫn chờ mới gặp lương duyên',
    wealth: 'Tài vận nhờ quý nhân giúp; thời trẻ tài vận kém, về già mới vững, nên giữ không nên xông',
    health: 'Thuộc Thổ, chú ý tỳ vị, xương khớp. Cần coi trọng chăm sóc sức khỏe tuổi già, nên phòng ngừa sớm',
  },
  '七杀': {
    niHaixia: 'Thầy Nghê nói Thất Sát là sao tướng quân, quả quyết, xông xáo, nhưng có tính cô khắc. Thất Sát tọa Mệnh phải có phụ tinh hóa giải tính cô, nếu không lục thân duyên mỏng. Thất Sát cùng Vũ Khúc đồng cung là cách Tướng Tài, rất tốt. Thất Sát sợ nhất Trúc La tam hạn (Dương Đà Hỏa Linh cùng chiếu), chủ đại hung, phải phòng tai nạn. Thất Sát Hóa Lộc lại thành tốt, có thể thành tài đại tướng.',
    classical: 'Cổ quyết: “Thất Sát là sao tướng quân, quả quyết xông xáo; thủ Mệnh thì tính cô khắc nặng, lục thân duyên mỏng.” Nam Bắc Sơn Nhân chú: “Thất Sát thủ Mệnh, tam hợp hội cát thì đại quý; gặp Trúc La tam hạn (Dương Đà Hỏa Linh) chủ đại hung, phòng tai nạn, phòng hình khắc.”',
    bestPalace: 'Mệnh (có phụ tinh), Quan Lộc',
    worstPalace: '夫妻宫、父母宫',
    career: 'Quân đội – công an, khởi nghiệp, giao dịch tài chính, lĩnh vực tự gánh vác; cần quyết đoán nhanh và khí phách',
    relationship: 'Tình cảm cô khắc, khó tìm bạn đời hợp, cần người bao dung được cá tính mạnh, nên kết hôn muộn',
    wealth: 'Tài vận biến động lớn, có cơ đại phú nhưng cũng lên xuống mạnh; cùng Vũ Khúc đồng cung thành cách Tướng Tài đại quý',
    health: 'Thuộc Kim, chú ý phổi, đại tràng. Tính nóng nảy dễ hại thân, nên học kiểm soát cảm xúc và tu thân',
  },
  '破军': {
    niHaixia: 'Thầy Nghê nói Phá Quân là sao phá cũ lập mới mạnh nhất, cũng là một trong những sao cô khắc nhất. Phá Quân Hóa Lộc mới chuyển tốt, chủ phá rồi lập. Phá Quân tọa Mệnh lục thân duyên mỏng nhưng khả năng khai sáng rất mạnh. Phá Quân hợp nhất cải cách, đổi mới; khi Hóa Lộc tài vận chuyển vượng, một phá một lập, cuối cùng thành sự nghiệp.',
    classical: 'Cổ quyết: “Phá Quân là sao phá cũ lập mới mạnh nhất, tọa Mệnh cô khắc, lục thân duyên mỏng, nhưng khai sáng rất mạnh; Hóa Lộc thì phá rồi lập, có thể thành đại nghiệp.” Nam Bắc Sơn Nhân chú: “Phá Quân thủ Mệnh, đời nhiều sóng gió; Hóa Lộc thì sau khi hao tài mới gây dựng lại, tài vận rốt cuộc chuyển tốt, chủ thành tựu về già.”',
    bestPalace: '官禄宫（化禄）、迁移宫',
    worstPalace: '夫妻宫、父母宫',
    career: 'Sự nghiệp khai phá, quân đội – công an, cải cách, quản lý thay đổi; hợp công việc tiên phong mở lĩnh vực mới',
    relationship: 'Tình cảm nhiều sóng gió, hợp tan bất định, lục thân duyên mỏng; cần chọn bạn đời độc lập, bao dung',
    wealth: 'Tài vận lên xuống mạnh, Hóa Lộc thì chuyển tốt; giữ nguyên thì tiền lùi, phải liên tục mở cục mới mới tích được của',
    health: 'Thuộc Thủy, chú ý thận, bàng quang, hệ sinh sản. Thể chất thất thường, nên duy trì thói quen vận động đều đặn',
  },
};

const levelConfig = {
  major: { label: '主星', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  lucky: { label: '吉星', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  sha:   { label: '煞星', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  minor: { label: 'Tạp tinh', color: 'text-slate-400 border-slate-500/25 bg-slate-500/10' },
};

const siHuaColors: Record<string, string> = {
  '禄': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  '权': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  '科': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  '忌': 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function StarDetailPanel({ star, palaceName, onClose }: StarDetailPanelProps) {
  const desc = star ? STAR_DESCRIPTIONS[star.name] : null;
  const detail = star ? STAR_DETAIL[star.name] : null;
  const typeConfig = star ? levelConfig[star.type] : null;

  return (
    <AnimatePresence>
      {star && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="card-glass rounded-xl overflow-hidden"
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--t-border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: 'var(--t-gold)' }}>{star.name}</span>
              {typeConfig && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
              )}
              {star.siHua && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${siHuaColors[star.siHua] || ''}`}>
                  化{star.siHua}
                </span>
              )}
            </div>
            <button onClick={onClose} className="transition-colors text-lg leading-none" style={{ color: 'var(--t-faint)' }}>×</button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[560px]">
            {/* 基本信息 */}
            {desc && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  `五行 · ${desc.element}`,
                  `Tính chất · ${desc.nature}`,
                  ...(palaceName ? [`Vị trí · ${palaceName}`] : []),
                  ...(star.brightness ? [star.brightness === 'bright' ? '庙旺' : star.brightness === 'dim' ? '落陷' : '平和'] : []),
                ].map(tag => (
                  <div key={tag} className="text-[10px] px-2 py-1 rounded-full"
                    style={{
                      border: '1px solid var(--t-border)',
                      color: tag.includes('庙旺') ? '#eab308' : tag.includes('落陷') ? '#ef4444' : 'var(--t-text2)',
                    }}>
                    {tag}
                  </div>
                ))}
              </div>
            )}

            {/* 关键词 */}
            {desc && (
              <div>
                <div className="text-[10px] tracking-widest mb-1.5" style={{ color: 'var(--t-faint)' }}>Đặc tính sao</div>
                <div className="flex flex-wrap gap-1.5">
                  {desc.keywords.split('·').map(k => (
                    <span key={k} className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ color: 'var(--t-gold)', border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(212,168,67,0.06)' }}>
                      {k.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 古书原文 */}
            {detail && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.12)' }}>
                <div className="text-[10px] tracking-widest mb-1.5 flex items-center gap-1" style={{ color: 'var(--t-gold)', opacity: 0.7 }}>
                  Cổ thư
                </div>
                <p className="text-[11px] leading-relaxed italic" style={{ color: 'var(--t-gold)', opacity: 0.8 }}>{detail.classical}</p>
              </div>
            )}

            {/* 倪海厦解读 */}
            {detail && (
              <>
                <div>
                  <div className="text-[10px] tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--t-faint)' }}>
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                    Luận giải của thầy Nghê Hải Hạ
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>{detail.niHaixia}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Hướng sự nghiệp', value: detail.career, icon: '◈' },
                    { label: 'Đặc điểm tình cảm', value: detail.relationship, icon: '♡' },
                    { label: 'Phân tích tài lộc', value: detail.wealth, icon: '◆' },
                    { label: 'Lưu ý sức khỏe', value: detail.health, icon: '☯' },
                  ].map(item => (
                    <div key={item.label} className="card-inner rounded-lg p-3">
                      <div className="text-[10px] mb-1 flex items-center gap-1" style={{ color: 'var(--t-faint)' }}>
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-[10px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(74,222,128,0.15)', background: 'rgba(74,222,128,0.05)' }}>
                    <div className="text-emerald-500 mb-0.5 font-medium">Cung tốt nhất</div>
                    <div className="text-emerald-500/70">{detail.bestPalace}</div>
                  </div>
                  <div className="text-[10px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.05)' }}>
                    <div className="text-red-500 mb-0.5 font-medium">Cung cần lưu ý</div>
                    <div className="text-red-500/70">{detail.worstPalace}</div>
                  </div>
                </div>
              </>
            )}

            {/* 辅星/煞星说明 */}
            {!detail && star.type !== 'major' && (
              <div className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>
                {star.type === 'lucky' && (
                  <>
                    {star.name === '文昌' && 'Văn Xương nhập cung: học hành thi cử thuận lợi, giấy tờ ấn tín có lợi, hợp công việc liên quan chữ nghĩa. Cổ quyết: “Văn Xương khoa giáp, chủ văn chương hiển đạt, thi ắt đỗ.”'}
                    {star.name === '文曲' && 'Văn Khúc nhập cung: tài nghệ xuất chúng, ăn nói giỏi, giỏi diễn đạt, thiên phú nghệ thuật. Cổ quyết: “Văn Khúc là sao tài nghệ, văn võ song toàn, khẩu tài hơn người.”'}
                    {star.name === '左辅' && 'Tả Phù nhập cung: có quý nhân giúp đỡ, được nâng đỡ, việc của cung này được hỗ trợ thiện chí. Cổ quyết: “Tả Phù là sao trợ lực, tọa Mệnh thì nhiều quý nhân, gặp hung hóa cát.”'}
                    {star.name === '右弼' && 'Hữu Bật nhập cung: có quý nhân giúp, nhiều quý nhân nữ, việc của cung này có người hỗ trợ. Cổ quyết: “Hữu Bật là sao âm trợ, nhiều quý nhân nữ, hóa hiểm thành an.”'}
                    {star.name === '天魁' && 'Thiên Khôi nhập cung: quý nhân dương (sinh ban ngày), nhiều quý nhân nam, có sức gặp hung hóa cát. Cổ quyết: “Thiên Khôi là Thiên Ất quý nhân, gặp ắt có quý nhân phù trì.”'}
                    {star.name === '天钺' && 'Thiên Việt nhập cung: quý nhân âm (sinh ban đêm), nhiều quý nhân nữ, thêm khí cát tường. Cổ quyết: “Thiên Việt là Ngọc Đường quý nhân, chủ âm trợ, nhiều quý nhân nữ.”'}
                    {star.name === '禄存' && 'Lộc Tồn nhập cung: tài lộc thủ thành, cung này có tài khí nhưng thuộc kiểu tài lộc thận trọng. Cổ quyết: “Lộc Tồn là sao tài lộc, giữ của có dư, tiền vào vững vàng.”'}
                    {star.name === '天马' && 'Thiên Mã nhập cung: bôn ba xê dịch, cầu tài trong động, nên chủ động, không nên ôm cây đợi thỏ. Cổ quyết: “Thiên Mã chủ động, gặp Lộc thì tài lộc song toàn, trong động sinh tài.”'}
                  </>
                )}
                {star.type === 'sha' && (
                  <>
                    {star.name === '地空' && 'Địa Không nhập cung: việc của cung này dễ hụt hẫng, tinh thần hao tán, nên chú ý sức khỏe tinh thần. Cổ quyết: “Địa Không chủ hư hao, nhập Mệnh thì tinh thần mơ hồ, phải phòng mơ tưởng.”'}
                    {star.name === '地劫' && 'Địa Kiếp nhập cung: việc của cung này dễ tổn thất bất ngờ, cần cẩn trọng tiền bạc, phòng tiểu nhân. Cổ quyết: “Địa Kiếp chủ kiếp tài, nhập Mệnh thì tài vận tổn hại, phòng mất mát bất ngờ.”'}
                    {star.name === '火星' && 'Hỏa Tinh nhập cung: việc của cung này nóng vội, cảm xúc dao động, nhưng gặp Tham Lang lại thành tốt. Cổ quyết: “Hỏa Tinh chủ nóng nảy, nhưng gặp Tham Lang đồng cung thành cách Hỏa Tham, chủ bạo phát.”'}
                    {star.name === '铃星' && 'Linh Tinh nhập cung: việc của cung này có trở ngại ngầm, phòng tiểu nhân sau lưng, mọi việc nên kín đáo. Cổ quyết: “Linh Tinh chủ ám sát, nhập Mệnh thường bị địch ngầm, phải phòng thị phi sau lưng.”'}
                    {star.name === '擎羊' && 'Kình Dương nhập cung: chủ hình khắc, việc của cung này nhiều trắc trở, dễ có tai nạn đổ máu. Cổ quyết: “Kình Dương là sao hình khắc, nhập Mệnh nhiều hình khắc, phải phòng tai nạn huyết quang.”'}
                    {star.name === '陀罗' && 'Đà La nhập cung: thị phi bám thân, việc của cung này dây dưa khó quyết, mọi việc nên chuẩn bị sớm. Cổ quyết: “Đà La chủ thị phi trì hoãn, nhập Mệnh thì làm việc chậm chạp, phải phòng vướng mắc không dứt.”'}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
