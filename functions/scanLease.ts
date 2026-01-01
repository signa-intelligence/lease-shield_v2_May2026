import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// ============================================================================
// LEASE SHIELD MULTI-ENGINE RISK DETECTION SYSTEM v2.0
// Comprehensive pattern-based lease risk analysis
// ============================================================================

// LEGALITY ENGINE - Thai law violations
const LEGALITY_RULES = [
  {
    id: 'illegal_utility_disconnect',
    severity: 'critical',
    category: 'Legal Rights',
    patterns: [
      /disconnect.*(?:water|electric|utilit)/i,
      /cut(?:ting)? off.*(?:water|electric|power)/i,
      /ตัด(?:น้ำ|ไฟ|สาธารณูปโภค)/,
      /หยุด.*สาธารณูปโภค/
    ],
    title_en: 'Illegal Utility Disconnection Clause',
    title_th: 'ข้อกำหนดการตัดสาธารณูปโภคที่ผิดกฎหมาย',
    explanation_en: 'Landlord cannot legally disconnect utilities as a penalty or eviction method under Thai law',
    explanation_th: 'เจ้าของบ้านไม่สามารถตัดสาธารณูปโภคเป็นการลงโทษตามกฎหมายไทย',
    why_en: 'Utility disconnection as enforcement violates tenant rights and consumer protection laws',
    why_th: 'การตัดสาธารณูปโภคเป็นการบังคับละเมิดสิทธิผู้เช่าและกฎหมายคุ้มครองผู้บริโภค',
    recommendation_en: '• Demand removal of this clause\n• Reference Thai Civil & Commercial Code § 538\n• This clause is likely unenforceable',
    recommendation_th: '• เรียกร้องให้ลบข้อกำหนดนี้\n• อ้างอิง ป.พ.พ. มาตรา 538\n• ข้อกำหนดนี้อาจบังคับใช้ไม่ได้'
  },
  {
    id: 'unrestricted_entry',
    severity: 'critical',
    category: 'Privacy & Access',
    patterns: [
      /(?:landlord|owner|lessor).*(?:may enter|right to enter|can access).*(?:any time|without notice|at will)/i,
      /entry.*without.*(?:notice|permission|consent)/i,
      /เจ้าของ.*เข้า.*(?:ได้ตลอดเวลา|โดยไม่แจ้ง)/
    ],
    title_en: 'Unrestricted Landlord Entry Rights',
    title_th: 'สิทธิเข้าถึงของเจ้าของบ้านไม่จำกัด',
    explanation_en: 'Allows landlord to enter property without reasonable notice or tenant consent',
    explanation_th: 'อนุญาตให้เจ้าของบ้านเข้าโดยไม่แจ้งล่วงหน้าหรือได้รับอนุญาต',
    why_en: 'Violates tenant privacy and peaceful enjoyment rights',
    why_th: 'ละเมิดความเป็นส่วนตัวและสิทธิการอยู่อาศัยอย่างสงบ',
    recommendation_en: '• Require 24-48 hour advance written notice\n• Exception only for genuine emergencies\n• Define "emergency" explicitly',
    recommendation_th: '• กำหนดให้แจ้งล่วงหน้าเป็นลายลักษณ์อักษร 24-48 ชั่วโมง\n• ยกเว้นเฉพาะกรณีฉุกเฉินจริง\n• ระบุคำว่า "ฉุกเฉิน" อย่างชัดเจน'
  },
  {
    id: 'court_rights_waiver',
    severity: 'critical',
    category: 'Rights & Legal',
    patterns: [
      /waive.*(?:right to|claim|dispute|court|legal action)/i,
      /no right to.*(?:sue|court|legal)/i,
      /irrevocably waive/i,
      /สละสิทธิ.*(?:ฟ้องร้อง|ศาล)/
    ],
    title_en: 'Waiver of Court/Dispute Rights',
    title_th: 'การสละสิทธิฟ้องร้อง/ข้อพิพาท',
    explanation_en: 'Clause forces tenant to waive legal rights to court access or dispute resolution',
    explanation_th: 'ข้อกำหนดบังคับให้ผู้เช่าสละสิทธิเข้าถึงศาลหรือแก้ไขข้อพิพาท',
    why_en: 'Such waivers may be unenforceable and violate access to justice',
    why_th: 'การสละสิทธิดังกล่าวอาจบังคับใช้ไม่ได้และละเมิดการเข้าถึงความยุติธรรม',
    recommendation_en: '• Remove this clause entirely\n• Seek legal advice if landlord insists\n• Consider alternative dispute resolution instead',
    recommendation_th: '• ลบข้อกำหนดนี้ออกทั้งหมด\n• ปรึกษาทนายหากเจ้าของบ้ายยืนยัน\n• พิจารณาการไกล่เกลี่ยข้อพิพาทแทน'
  }
];

// PROCEDURAL TRAP ENGINE
const PROCEDURAL_RULES = [
  {
    id: 'auto_renewal_no_consent',
    severity: 'high',
    category: 'Procedural Fairness',
    patterns: [
      /auto(?:matic(?:ally)?)?.*(?:renew|extend)/i,
      /renew.*unless.*(?:notice|notif)/i,
      /ต่ออายุ(?:อัตโนมัติ|โดยอัตโนมัติ)/
    ],
    title_en: 'Automatic Renewal Without Affirmative Consent',
    title_th: 'การต่ออายุอัตโนมัติโดยไม่ได้รับความยินยอม',
    explanation_en: 'Lease automatically renews unless tenant provides notice to terminate',
    explanation_th: 'สัญญาต่ออายุอัตโนมัติเว้นแต่ผู้เช่าจะแจ้งยกเลิก',
    why_en: 'Shifts burden to tenant to actively terminate, enabling unwanted renewals',
    why_th: 'เปลี่ยนภาระให้ผู้เช่าต้องแจ้งยกเลิก ทำให้เกิดการต่อสัญญาที่ไม่ต้องการ',
    recommendation_en: '• Change to opt-in renewal requiring both parties to agree\n• OR ensure notice window is 60+ days before renewal\n• Add mutual confirmation step',
    recommendation_th: '• เปลี่ยนเป็นต้องยืนยันต่อสัญญาโดยทั้งสองฝ่าย\n• หรือกำหนดช่วงแจ้งล่วงหน้า 60+ วัน\n• เพิ่มขั้นตอนยืนยันร่วมกัน'
  },
  {
    id: 'dual_channel_notice',
    severity: 'high',
    category: 'Procedural Fairness',
    patterns: [
      /(?:notice|notification).*(?:email|mail|letter).*(?:and|plus|\+).*(?:registered|certified|courier|mail)/i,
      /registered.*mail.*and.*email/i,
      /แจ้ง.*(?:อีเมล|จดหมาย).*และ.*(?:ลงทะเบียน|EMS)/
    ],
    title_en: 'Dual-Channel Notice Requirement',
    title_th: 'ข้อกำหนดการแจ้งผ่านช่องทางคู่',
    explanation_en: 'Requires tenant to send notice via multiple channels (e.g., email AND registered mail)',
    explanation_th: 'กำหนดให้ผู้เช่าส่งการแจ้งผ่านหลายช่องทาง (เช่น อีเมล และ ไปรษณีย์ลงทะเบียน)',
    why_en: 'Creates procedural trap where missing one channel invalidates the entire notice',
    why_th: 'สร้างกับดักที่การพลาดช่องทางหนึ่งทำให้การแจ้งไม่สมบูรณ์',
    recommendation_en: '• Simplify to single channel (email OR mail)\n• OR allow either/or instead of both\n• Ensure notice is valid when sent, not when received',
    recommendation_th: '• ทำให้เป็นช่องทางเดียว (อีเมล หรือ จดหมาย)\n• หรือให้เลือกอย่างใดอย่างหนึ่งแทนทั้งสองอย่าง\n• กำหนดให้การแจ้งมีผลเมื่อส่ง ไม่ใช่เมื่อได้รับ'
  },
  {
    id: 'confirmed_delivery_only',
    severity: 'high',
    category: 'Procedural Fairness',
    patterns: [
      /(?:notice|termination).*valid.*(?:only upon|when).*(?:confirmed|actual).*(?:delivery|receipt)/i,
      /effective.*upon.*confirm/i,
      /การแจ้ง.*สมบูรณ์.*เมื่อได้รับ(?:การ)?ยืนยัน/
    ],
    title_en: 'Notice Valid Only Upon Confirmed Delivery',
    title_th: 'การแจ้งมีผลเมื่อได้รับการยืนยันเท่านั้น',
    explanation_en: 'Notice is not valid until landlord confirms receipt, putting delivery risk on tenant',
    explanation_th: 'การแจ้งไม่มีผลจนกว่าเจ้าของบ้านจะยืนยันรับ ทำให้ผู้เช่ารับความเสี่ยง',
    why_en: 'Tenant bears all postal/delivery failures, making timely notice nearly impossible',
    why_th: 'ผู้เช่ารับความเสี่ยงจากความล้มเหลวของไปรษณีย์ ทำให้แจ้งทันเวลาเป็นไปไม่ได้',
    recommendation_en: '• Change to "effective X days after sending"\n• Remove confirmation requirement\n• Use delivery tracking as proof, not landlord confirmation',
    recommendation_th: '• เปลี่ยนเป็น "มีผล X วันหลังจากส่ง"\n• ลบข้อกำหนดการยืนยัน\n• ใช้ระบบติดตามพัสดุเป็นหลักฐาน ไม่ใช่การยืนยันของเจ้าของบ้าน'
  },
  {
    id: 'immediate_termination_no_cure',
    severity: 'high',
    category: 'Procedural Fairness',
    patterns: [
      /terminate.*immediately/i,
      /immediate termination/i,
      /without.*(?:cure period|opportunity to remedy)/i,
      /ยกเลิก.*ทันที/
    ],
    title_en: 'Immediate Termination Without Cure Period',
    title_th: 'การยกเลิกทันทีโดยไม่มีโอกาสแก้ไข',
    explanation_en: 'Landlord can terminate lease immediately for breach without giving tenant time to fix',
    explanation_th: 'เจ้าของบ้านสามารถยกเลิกสัญญาทันทีโดยไม่ให้เวลาผู้เช่าแก้ไข',
    why_en: 'No cure period prevents tenant from correcting minor violations',
    why_th: 'ไม่มีช่วงเวลาแก้ไขทำให้ผู้เช่าไม่สามารถแก้ไขการละเมิดเล็กน้อยได้',
    recommendation_en: '• Add 7-14 day cure period for most breaches\n• Allow immediate termination only for severe violations\n• Define what constitutes "material breach"',
    recommendation_th: '• เพิ่มช่วงเวลาแก้ไข 7-14 วันสำหรับการละเมิดส่วนใหญ่\n• อนุญาตยกเลิกทันทีเฉพาะการละเมิดร้ายแรง\n• กำหนดคำว่า "การละเมิดสำคัญ" ให้ชัดเจน'
  }
];

// FINANCIAL EXPOSURE ENGINE
const FINANCIAL_RULES = [
  {
    id: 'excessive_deposit_amount',
    severity: 'high',
    category: 'Financial Risk',
    patterns: [
      /deposit.*(?:equal to|equivalent).{0,30}(?:3|three|4|four|5|five|6|six).*month/i,
      /security.*3.*month/i,
      /ประกัน.*[3-6].*เดือน/
    ],
    title_en: 'Excessive Security Deposit Amount',
    title_th: 'จำนวนเงินมัดจำสูงเกินไป',
    explanation_en: 'Deposit exceeds standard 1-2 months rent, tying up excessive tenant capital',
    explanation_th: 'เงินมัดจำเกินมาตรฐาน 1-2 เดือน ทำให้เงินผู้เช่าติดขัด',
    why_en: 'Excessive deposit creates financial hardship and increases forfeiture risk',
    why_th: 'เงินมัดจำมากเกินไปสร้างภาระทางการเงินและเพิ่มความเสี่ยงการสูญเสีย',
    recommendation_en: '• Negotiate to reduce to 1-2 months rent\n• Request installment payment option\n• Ensure deposit held in separate escrow account',
    recommendation_th: '• เจรจาลดเหลือ 1-2 เดือน\n• ขอผ่อนชำระ\n• ให้ฝากในบัญชีแยกต่างหาก'
  },
  {
    id: 'deposit_sole_discretion',
    severity: 'high',
    category: 'Financial Risk',
    patterns: [
      /deposit.*(?:forfeit|retain|withhold).*(?:sole discretion|landlord.{0,20}determin)/i,
      /damages.*alleged/i,
      /deduct.*as.*(?:landlord|owner).*(?:sees fit|deems)/i,
      /มัดจำ.*(?:ตามดุลยพินิจ|กล่าวอ้าง)/
    ],
    title_en: 'Deposit Retention at Sole Discretion',
    title_th: 'การเก็บเงินมัดจำตามดุลยพินิจของเจ้าของบ้าน',
    explanation_en: 'Landlord can withhold deposit based on subjective judgment or unproven "alleged" damages',
    explanation_th: 'เจ้าของบ้านสามารถเก็บเงินมัดจำตามดุลยพินิจหรือความเสียหายที่ "กล่าวอ้าง" โดยไม่พิสูจน์',
    why_en: 'No objective standard means tenant cannot challenge withholding',
    why_th: 'ไม่มีเกณฑ์ที่ชัดเจนทำให้ผู้เช่าไม่สามารถโต้แย้งการเก็บเงิน',
    recommendation_en: '• Require itemized list with photos before any deduction\n• Set maximum deduction limits\n• Add neutral dispute resolution mechanism',
    recommendation_th: '• กำหนดให้มีรายการพร้อมรูปภาพก่อนหักเงิน\n• กำหนดวงเงินหักสูงสุด\n• เพิ่มกลไกระงับข้อพิพาทที่เป็นกลาง'
  },
  {
    id: 'early_termination_full_forfeiture',
    severity: 'high',
    category: 'Financial Risk',
    patterns: [
      /early.*termination.*(?:forfeit|lose).*deposit/i,
      /break.*lease.*forfeit/i,
      /ยกเลิก.*ก่อน.*(?:สูญเสีย|ริบ).*มัดจำ/
    ],
    title_en: 'Full Deposit Forfeiture for Early Termination',
    title_th: 'ริบเงินมัดจำทั้งหมดเมื่อยกเลิกก่อนกำหนด',
    explanation_en: 'Tenant loses entire deposit if terminating early, regardless of circumstances',
    explanation_th: 'ผู้เช่าเสียเงินมัดจำทั้งหมดหากยกเลิกก่อนกำหนด ไม่ว่ากรณีใดๆ',
    why_en: 'Disproportionate penalty - actual landlord damages rarely equal full deposit',
    why_th: 'ค่าปรับไม่สมดุล - ความเสียหายจริงไม่เท่ากับเงินมัดจำทั้งหมด',
    recommendation_en: '• Cap penalty at 1 month rent OR actual re-rental costs\n• Add prorated penalty based on remaining lease term\n• Allow termination for valid reasons (job relocation, etc)',
    recommendation_th: '• จำกัดค่าปรับที่ 1 เดือน หรือค่าใช้จ่ายจริง\n• ปรับค่าปรับตามระยะเวลาที่เหลือ\n• อนุญาตยกเลิกในกรณีที่สมเหตุสมผล (ย้ายงาน ฯลฯ)'
  },
  {
    id: 'holdover_extreme_penalty',
    severity: 'critical',
    category: 'Financial Risk',
    patterns: [
      /holdover.*(?:2x|double|3x|triple|twice|three times)/i,
      /overstay.*(?:200%|300%|\d+x)/i,
      /(?:stay|remain).*after.*(?:double|triple).*rent/i,
      /พักอาศัยเกิน.*(?:สอง|สาม|2|3).*เท่า/
    ],
    title_en: 'Extreme Holdover Penalty (2-3x Rent Multiplier)',
    title_th: 'ค่าปรับพักอาศัยเกินกำหนดสูงมาก (คูณ 2-3 เท่า)',
    explanation_en: 'Daily rent increases to 2-3× normal rate if tenant stays past lease end',
    explanation_th: 'ค่าเช่ารายวันเพิ่มเป็น 2-3 เท่าหากพักอาศัยเกินวันสิ้นสุดสัญญา',
    why_en: 'Punitive multiplier penalty is excessive and may be unenforceable',
    why_th: 'ค่าปรับที่เป็นการลงโทษสูงเกินไปและอาจบังคับใช้ไม่ได้',
    recommendation_en: '• Cap at 1.5× daily rent maximum\n• Add 7-day grace period before penalty applies\n• Require good faith effort to vacate',
    recommendation_th: '• จำกัดไม่เกิน 1.5 เท่า\n• เพิ่มช่วงผ่อนผัน 7 วัน\n• กำหนดให้มีความพยายามอย่างจริงใจในการย้ายออก'
  },
  {
    id: 'unilateral_rent_increase',
    severity: 'high',
    category: 'Financial Risk',
    patterns: [
      /rent.*(?:increase|adjust|raise).*(?:sole discretion|at.*discretion|may.*increase)/i,
      /renewal.*rent.*(?:determin|set by landlord)/i,
      /ค่าเช่า.*ปรับ.*(?:ตามต้องการ|ดุลยพินิจ)/
    ],
    title_en: 'Unilateral Rent Increase on Renewal',
    title_th: 'การปรับค่าเช่าฝ่ายเดียวเมื่อต่อสัญญา',
    explanation_en: 'Landlord can set new rent at any amount upon renewal without negotiation or cap',
    explanation_th: 'เจ้าของบ้านสามารถกำหนดค่าเช่าใหม่เท่าใดก็ได้โดยไม่ต้องเจรจาหรือมีเพดาน',
    why_en: 'No protection against unreasonable rent increases forces tenant acceptance',
    why_th: 'ไม่มีการป้องกันการขึ้นค่าเช่าที่ไม่สมเหตุสมผล บังคับให้ผู้เช่ายอมรับ',
    recommendation_en: '• Add annual increase cap (e.g., max 5% per year)\n• Require mutual agreement for increases > 10%\n• Link to local market rates or inflation index',
    recommendation_th: '• เพิ่มเพดานการขึ้นค่าเช่าต่อปี (เช่น สูงสุด 5%)\n• กำหนดให้ตกลงร่วมกันหากขึ้นเกิน 10%\n• ผูกกับอัตราตลาดท้องถิ่นหรือดัชนีเงินเฟ้อ'
  },
  {
    id: 'smoking_excessive_fine',
    severity: 'high',
    category: 'Financial Risk',
    patterns: [
      /smok(?:e|ing).*(?:fine|penalty|charge).{0,40}(?:฿\s*[2-9]\d{4,}|\$\s*[1-9]\d{3,}|[2-9]\d{4,})/i,
      /บุหรี่.*ปรับ.*[2-9]\d{4,}/
    ],
    title_en: 'Excessive Smoking Fine (฿20,000+)',
    title_th: 'ค่าปรับสูบบุหรี่สูงเกินไป (20,000+ บาท)',
    explanation_en: 'Fine far exceeds reasonable cleaning and deodorization costs',
    explanation_th: 'ค่าปรับสูงกว่าต้นทุนทำความสะอาดและกำจัดกลิ่นที่เป็นธรรม',
    why_en: 'Punitive fine designed to extract money, not compensate for actual damage',
    why_th: 'ค่าปรับที่เป็นการลงโทษเพื่อเรียกเก็บเงิน ไม่ใช่ชดเชยความเสียหายจริง',
    recommendation_en: '• Reduce to actual cleaning cost (typically ฿5,000-10,000)\n• Require proof of professional cleaning invoice\n• Add smoke detector requirement instead of blanket ban',
    recommendation_th: '• ลดเหลือค่าทำความสะอาดจริง (โดยทั่วไป 5,000-10,000 บาท)\n• กำหนดให้มีใบเสร็จทำความสะอาดจากมืออาชีพ\n• เพิ่มเครื่องตรวจจับควันแทนการห้ามทั้งหมด'
  },
  {
    id: 'pets_daily_penalty',
    severity: 'high',
    category: 'Financial Risk',
    patterns: [
      /pet.*(?:prohibited|banned|not.*allow).*(?:penalty|fine).{0,40}(?:per day|daily)/i,
      /สัตว์.*(?:ห้าม|ไม่อนุญาต).*ปรับ.*(?:วัน|รายวัน)/
    ],
    title_en: 'Pet Prohibition with Daily Fine',
    title_th: 'ห้ามเลี้ยงสัตว์พร้อมค่าปรับรายวัน',
    explanation_en: 'Daily fines for having pets accumulate rapidly into large amounts',
    explanation_th: 'ค่าปรับรายวันสำหรับการเลี้ยงสัตว์สะสมเป็นจำนวนมาก',
    why_en: 'Disproportionate penalty that grows exponentially over time',
    why_th: 'ค่าปรับไม่สมดุลที่เพิ่มขึ้นแบบทวีคูณตามเวลา',
    recommendation_en: '• Remove daily penalty, use one-time pet deposit instead\n• Allow small pets with reasonable restrictions\n• Cap total penalty if daily fine remains',
    recommendation_th: '• ลบค่าปรับรายวัน ใช้เงินมัดจำสัตว์เลี้ยงครั้งเดียวแทน\n• อนุญาตสัตว์ขนาดเล็กพร้อมข้อจำกัดที่เป็นธรรม\n• จำกัดค่าปรับรวมหากยังคงมีค่าปรับรายวัน'
  },
  {
    id: 'utility_unregulated_pricing',
    severity: 'medium',
    category: 'Financial Risk',
    patterns: [
      /utilit(?:y|ies).*(?:as.*determin|at.*rate.*set|mark.*up|plus)/i,
      /electric.*water.*(?:landlord rate|owner rate)/i,
      /สาธารณูปโภค.*(?:กำหนดโดย|อัตราของเจ้าของ)/
    ],
    title_en: 'Unregulated Utility Pricing / Markup Allowed',
    title_th: 'ค่าสาธารณูปโภคไม่มีการควบคุม / มีมาร์คอัป',
    explanation_en: 'Landlord can set utility rates without transparency or regulatory cap',
    explanation_th: 'เจ้าของบ้านสามารถกำหนดอัตราค่าสาธารณูปโภคโดยไม่โปร่งใสหรือมีเพดาน',
    why_en: 'Enables price gouging on utilities beyond actual cost',
    why_th: 'เปิดโอกาสเรียกเก็บค่าสาธารณูปโภคเกินต้นทุนจริง',
    recommendation_en: '• Require disclosure of utility rates in advance\n• Cap at 110% of government/MEA rate\n• OR install direct meters in tenant name',
    recommendation_th: '• กำหนดให้เปิดเผยอัตราล่วงหน้า\n• จำกัดที่ 110% ของอัตรารัฐ/MEA\n• หรือติดตั้งมิเตอร์ตรงในชื่อผู้เช่า'
  }
];

// POWER IMBALANCE ENGINE
const POWER_IMBALANCE_RULES = [
  {
    id: 'sole_discretion_abuse',
    severity: 'medium',
    category: 'Fairness & Balance',
    patterns: [
      /(?:landlord|owner|lessor).{0,50}(?:sole|absolute|complete) discretion/i,
      /at.*(?:landlord|owner).{0,20}(?:discretion|determination)/i,
      /ตาม(?:ดุลยพินิจ|ความเห็น).*เจ้าของ/
    ],
    title_en: 'Broad "Sole Discretion" Powers',
    title_th: 'อำนาจ "ดุลยพินิจ" ที่กว้างเกินไป',
    explanation_en: 'Multiple clauses grant landlord unchecked discretionary authority',
    explanation_th: 'หลายข้อกำหนดให้อำนาจดุลยพินิจแก่เจ้าของบ้านโดยไม่มีการตรวจสอบ',
    why_en: 'No accountability or reasonableness standard for landlord decisions',
    why_th: 'ไม่มีความรับผิดชอบหรือเกณฑ์ความสมเหตุสมผลสำหรับการตัดสินใจของเจ้าของบ้าน',
    recommendation_en: '• Add "acting reasonably" qualifier to discretionary powers\n• Require written justification for discretionary decisions\n• Add dispute resolution for unreasonable discretion',
    recommendation_th: '• เพิ่มคำว่า "อย่างสมเหตุสมผล" ในอำนาจดุลยพินิจ\n• กำหนดให้มีเหตุผลเป็นลายลักษณ์อักษร\n• เพิ่มกลไกแก้ไขข้อพิพาทสำหรับการใช้ดุลยพินิจที่ไม่สมเหตุสมผล'
  },
  {
    id: 'landlord_termination_asymmetry',
    severity: 'medium',
    category: 'Fairness & Balance',
    patterns: [
      /landlord.*may.*terminate.*(?:at any time|without cause|for any reason)/i,
      /(?:owner|lessor).*right.*terminate.*(?:sole discretion|immediately)/i
    ],
    title_en: 'Asymmetric Termination Rights (Landlord Only)',
    title_th: 'สิทธิยกเลิกแบบไม่สมดุล (เจ้าของบ้านเท่านั้น)',
    explanation_en: 'Landlord can terminate without cause while tenant faces penalties for same',
    explanation_th: 'เจ้าของบ้านสามารถยกเลิกโดยไม่มีเหตุผล ในขณะที่ผู้เช่าต้องเสียค่าปรับ',
    why_en: 'One-sided power creates instability for tenant',
    why_th: 'อำนาจฝ่ายเดียวสร้างความไม่มั่นคงให้ผู้เช่า',
    recommendation_en: '• Make termination rights mutual\n• Require notice period equal for both parties\n• Add relocation compensation if landlord terminates early',
    recommendation_th: '• ทำให้สิทธิยกเลิกเท่าเทียมกัน\n• กำหนดให้ช่วงแจ้งเท่ากันทั้งสองฝ่าย\n• เพิ่มค่าชดเชยการย้ายหากเจ้าของบ้านยกเลิกก่อนกำหนด'
  }
];

// RIGHTS SUPPRESSION ENGINE
const RIGHTS_SUPPRESSION_RULES = [
  {
    id: 'guest_extreme_restrictions',
    severity: 'medium',
    category: 'Rights & Usage',
    patterns: [
      /guest.*(?:prohibited|not.*allow|forbidden)/i,
      /visitor.*(?:max \d+ (?:hour|day)|register|report|approval)/i,
      /overnight.*guest.*(?:not.*permit|prohibit)/i,
      /แขก.*(?:ห้าม|ไม่อนุญาต)/
    ],
    title_en: 'Extreme Guest/Visitor Restrictions',
    title_th: 'ข้อจำกัดแขก/ผู้มาเยือนที่รุนแรง',
    explanation_en: 'Prohibits or severely restricts tenant ability to have guests',
    explanation_th: 'ห้ามหรือจำกัดความสามารถของผู้เช่าในการมีแขกอย่างรุนแรง',
    why_en: 'Interferes with normal residential use and tenant privacy',
    why_th: 'แทรกแซงการใช้งานที่พักอาศัยปกติและความเป็นส่วนตัวของผู้เช่า',
    recommendation_en: '• Allow reasonable overnight guests (e.g., up to 7 days/month)\n• Remove registration/approval requirements\n• Limit to safety/security concerns only',
    recommendation_th: '• อนุญาตแขกค้างคืนที่เป็นธรรม (เช่น ถึง 7 วัน/เดือน)\n• ลบข้อกำหนดการลงทะเบียน/ขออนุญาต\n• จำกัดเฉพาะเรื่องความปลอดภัยเท่านั้น'
  },
  {
    id: 'property_use_restrictions',
    severity: 'medium',
    category: 'Rights & Usage',
    patterns: [
      /prohibit.*(?:cooking|laundry|hang|dry)/i,
      /not.*allow.*(?:alterations|decorat|paint|nail)/i,
      /ห้าม.*(?:ทำอาหาร|ซักผ้า|ตาก)/
    ],
    title_en: 'Excessive Property Use Restrictions',
    title_th: 'ข้อจำกัดการใช้งานที่มากเกินไป',
    explanation_en: 'Restricts normal residential activities beyond reasonable bounds',
    explanation_th: 'จำกัดกิจกรรมการอยู่อาศัยปกติเกินกว่าขอบเขตที่สมเหตุสมผล',
    why_en: 'Unreasonable restrictions interfere with livability',
    why_th: 'ข้อจำกัดที่ไม่สมเหตุสมผลขัดขวางการอยู่อาศัย',
    recommendation_en: '• Allow normal residential activities\n• Limit restrictions to safety/structural concerns\n• Clarify what modifications require approval',
    recommendation_th: '• อนุญาตกิจกรรมการอยู่อาศัยปกติ\n• จำกัดข้อจำกัดเฉพาะความปลอดภัย/โครงสร้าง\n• ชี้แจงว่าการปรับแต่งใดต้องขออนุญาต'
  }
];

// MISSING SAFEGUARDS ENGINE
const MISSING_SAFEGUARDS_RULES = [
  {
    id: 'no_deposit_return_timeframe',
    severity: 'medium',
    category: 'Financial Risk',
    check: (details) => !details.deposit_return_days || details.deposit_return_days === 0,
    title_en: 'No Deposit Return Timeframe Specified',
    title_th: 'ไม่ระบุกรอบเวลาคืนเงินมัดจำ',
    explanation_en: 'Lease does not specify when deposit must be returned after move-out',
    explanation_th: 'สัญญาไม่ระบุว่าต้องคืนเงินมัดจำเมื่อใด',
    why_en: 'No deadline allows indefinite deposit retention',
    why_th: 'ไม่มีกำหนดเวลาทำให้เก็บเงินมัดจำได้ไม่จำกัด',
    recommendation_en: '• Add specific timeframe (e.g., 30 days after move-out)\n• Require itemized deduction list within 14 days\n• Include interest penalty for late return',
    recommendation_th: '• เพิ่มกรอบเวลาที่ชัดเจน (เช่น 30 วันหลังย้ายออก)\n• กำหนดให้มีรายการหักเงินภายใน 14 วัน\n• รวมดอกเบี้ยสำหรับการคืนช้า'
  },
  {
    id: 'abandoned_property_short_period',
    severity: 'high',
    category: 'Rights & Legal',
    patterns: [
      /abandon.*(?:24|twenty-four|48|forty-eight) hour/i,
      /deemed.*abandon.*(?:1|one|2|two) day/i,
      /ทิ้ง.*(?:24|48).*ชั่วโมง/
    ],
    title_en: 'Property Deemed Abandoned After 24-48 Hours',
    title_th: 'ทรัพย์สินถือว่าถูกทิ้งหลัง 24-48 ชั่วโมง',
    explanation_en: 'Extremely short timeframe before property is considered abandoned and can be disposed',
    explanation_th: 'กรอบเวลาสั้นมากก่อนที่ทรัพย์สินจะถือว่าถูกทิ้งและสามารถทำลาย',
    why_en: 'Unreasonable - does not account for travel, emergencies, or hospitalization',
    why_th: 'ไม่สมเหตุสมผล - ไม่คำนึงถึงการเดินทาง ฉุกเฉิน หรือเข้าโรงพยาบาล',
    recommendation_en: '• Extend to minimum 7-14 days\n• Require written notice before disposal\n• Allow tenant to recover belongings without penalty',
    recommendation_th: '• ขยายเป็นอย่างน้อย 7-14 วัน\n• กำหนดให้แจ้งเป็นลายลักษณ์อักษรก่อนทำลาย\n• อนุญาตให้ผู้เช่ารับของคืนโดยไม่มีค่าปรับ'
  }
];

// PREDATORY LANGUAGE DETECTOR
const PREDATORY_PHRASES = [
  { phrase: 'sole discretion', weight: 3 },
  { phrase: 'absolute discretion', weight: 4 },
  { phrase: 'without notice', weight: 2 },
  { phrase: 'without refund', weight: 2 },
  { phrase: 'irrevocably', weight: 4 },
  { phrase: 'waive', weight: 3 },
  { phrase: 'alleged', weight: 2 },
  { phrase: 'may terminate immediately', weight: 3 },
  { phrase: 'forfeit', weight: 3 },
  { phrase: 'no right to', weight: 3 },
  { phrase: 'without compensation', weight: 3 },
  { phrase: 'at landlord determination', weight: 2 }
];

function analyzePredatoryLanguage(text, userLang) {
  let score = 0;
  const found = [];
  
  PREDATORY_PHRASES.forEach(({ phrase, weight }) => {
    const regex = new RegExp(phrase, 'gi');
    const matches = text.match(regex);
    if (matches) {
      score += weight * matches.length;
      found.push({ phrase, count: matches.length });
    }
  });

  if (score >= 8) {
    const severity = score >= 15 ? 'high' : 'medium';
    const foundList = found.map(f => `${f.phrase} (${f.count}×)`).join(', ');
    
    return {
      id: 'predatory_language_pattern',
      severity,
      category: 'Fairness & Balance',
      title_en: 'Predatory/Unbalanced Language Pattern',
      title_th: 'รูปแบบภาษาที่ไม่เป็นธรรม/เอื้อประโยชน์ฝ่ายเดียว',
      explanation_en: `Document uses significantly landlord-favoring language throughout. Found: ${foundList}`,
      explanation_th: `เอกสารใช้ภาษาที่เอื้อประโยชน์ต่อเจ้าของบ้านอย่างมีนัยสำคัญ พบ: ${foundList}`,
      evidence: found.slice(0, 3).map(f => f.phrase).join('; '),
      why_en: 'Frequent one-sided language indicates structural power imbalance',
      why_th: 'การใช้ภาษาฝ่ายเดียวบ่อยครั้งบ่งบอกถึงความไม่สมดุลของอำนาจ',
      recommendation_en: '• Request balanced language throughout\n• Add "acting reasonably" qualifiers\n• Ensure tenant has equivalent protections',
      recommendation_th: '• ขอให้ใช้ภาษาที่สมดุลทั่วทั้งเอกสาร\n• เพิ่มคำว่า "อย่างสมเหตุสมผล"\n• ให้แน่ใจว่าผู้เช่ามีการป้องกันเทียบเท่า',
      predatory_score: score
    };
  }
  
  return null;
}

// PENALTY EVALUATOR
function evaluatePenalties(text, monthlyRent, userLang) {
  const penalties = [];
  
  // Daily penalties
  const dailyPatterns = [
    /(?:฿\s*)?(\d{1,3}(?:,\d{3})*)\s*(?:baht|฿)?.*(?:per day|daily|รายวัน|ต่อวัน)/gi,
    /(?:per day|daily|รายวัน).*(?:฿\s*)?(\d{1,3}(?:,\d{3})*)/gi
  ];
  
  dailyPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (amount > 100) {
        const annualized = amount * 30;
        let severity = 'high';
        
        if (monthlyRent > 0 && (amount / monthlyRent > 0.005)) {
          severity = 'critical';
        }
        
        penalties.push({
          type: 'daily',
          amount,
          severity,
          context: match[0],
          note: monthlyRent > 0 ? `${((amount / monthlyRent) * 100).toFixed(1)}% of monthly rent per day` : null
        });
      }
    });
  });

  // Fixed penalties
  const fixedPatterns = [
    /(?:fine|penalty|charge|ค่าปรับ).{0,30}(?:฿\s*)?(\d{1,3}(?:,\d{3})*)/gi
  ];
  
  fixedPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (amount > 1000 && !match[0].toLowerCase().includes('per day') && !match[0].includes('รายวัน')) {
        let severity = 'medium';
        
        if (monthlyRent > 0) {
          const ratio = amount / monthlyRent;
          if (ratio >= 1.0) severity = 'critical';
          else if (ratio >= 0.5) severity = 'high';
        } else if (amount >= 20000) {
          severity = 'high';
        }
        
        penalties.push({
          type: 'fixed',
          amount,
          severity,
          context: match[0],
          note: monthlyRent > 0 ? `${((amount / monthlyRent) * 100).toFixed(0)}% of monthly rent` : null
        });
      }
    });
  });

  // Multiplier penalties
  if (/(?:double|2x|twice|two times).*rent/i.test(text) || /ค่าเช่า.*(?:สอง|2).*เท่า/.test(text)) {
    penalties.push({
      type: 'multiplier',
      multiplier: 2,
      severity: 'critical',
      context: 'Rent multiplier penalty'
    });
  }
  
  if (/(?:triple|3x|three times).*rent/i.test(text) || /ค่าเช่า.*(?:สาม|3).*เท่า/.test(text)) {
    penalties.push({
      type: 'multiplier',
      multiplier: 3,
      severity: 'critical',
      context: 'Rent multiplier penalty'
    });
  }

  return penalties;
}

// COMPOUND PATTERN DETECTOR
function detectCompoundRisks(clauses, userLang) {
  const compounds = [];
  
  // TENANT ENTRAPMENT PATTERN
  const hasAutoRenewal = clauses.some(c => 
    /auto(?:matic)?.*renew/i.test(c.raw_text) || /ต่ออายุ.*อัตโนมัติ/.test(c.raw_text)
  );
  
  const hasDualChannel = clauses.some(c =>
    /(?:email.*and.*mail|mail.*and.*email|registered.*and.*email)/i.test(c.raw_text)
  );
  
  const hasConfirmedDelivery = clauses.some(c =>
    /valid.*only.*(?:upon|when).*confirm/i.test(c.raw_text) || /รับรอง.*การส่ง/.test(c.raw_text)
  );

  if (hasAutoRenewal && (hasDualChannel || hasConfirmedDelivery)) {
    const contributingClauses = clauses
      .filter(c => 
        /auto.*renew|dual.*channel|email.*and.*mail|valid.*confirm/i.test(c.raw_text)
      )
      .map(c => c.clause_id);

    compounds.push({
      id: 'compound_tenant_entrapment',
      severity: 'critical',
      category: 'Procedural Fairness',
      title_en: '🚨 Tenant Entrapment Pattern (Multi-Clause)',
      title_th: '🚨 รูปแบบกับดักผู้เช่า (หลายข้อ)',
      explanation_en: 'Combination of auto-renewal + complex notice requirements creates a procedural trap where tenants are locked into unwanted renewals',
      explanation_th: 'การรวมกันของการต่ออายุอัตโนมัติและข้อกำหนดการแจ้งที่ซับซ้อนสร้างกับดักที่ล็อคผู้เช่าให้ต่อสัญญาที่ไม่ต้องการ',
      evidence: `Multi-clause pattern detected across: ${contributingClauses.join(', ')}`,
      why_en: 'This combination is specifically designed to trap tenants into renewals they cannot escape',
      why_th: 'การรวมกันนี้ออกแบบมาโดยเฉพาะเพื่อดักจับผู้เช่าให้ต่อสัญญาที่หนีไม่ได้',
      recommendation_en: '• CRITICAL: Remove auto-renewal entirely\n• OR simplify notice to single email with 60+ day window\n• Add mutual renewal confirmation requirement',
      recommendation_th: '• สำคัญมาก: ลบการต่ออายุอัตโนมัติทั้งหมด\n• หรือทำให้การแจ้งเป็นอีเมลเดียวกับช่วง 60+ วัน\n• เพิ่มข้อกำหนดการยืนยันต่อสัญญาร่วมกัน',
      compound: true,
      contributing_clauses: contributingClauses
    });
  }

  return compounds;
}

// MAIN SCAN FUNCTION
Deno.serve(async (req) => {
  const body = await req.json();
  const requestId = body.requestId || crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();
  const scanId = body.scanId || crypto.randomUUID();
  
  const logStage = (stage, data) => {
    console.log(`[SCAN:${scanId}][REQ:${requestId}] ${stage}:`, { 
      ...data, 
      elapsed: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
  };

  try {
    logStage('ENGINE_START', { version: 'v2.0-multi-engine' });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized',
        diagnostic: { requestId, errorCategory: 'AUTH_ERROR' }
      }, { status: 401 });
    }

    const { fileUrls, leaseId } = body;
    
    if (!fileUrls || fileUrls.length === 0) {
      return Response.json({ 
        success: false,
        error: 'No file URLs provided',
        diagnostic: { scanId, requestId, errorCategory: 'VALIDATION_ERROR' }
      }, { status: 400 });
    }

    if (leaseId) {
      await base44.asServiceRole.entities.Lease.update(leaseId, { status: 'processing' });
    }
    
    // ========================================================================
    // PHASE 1: CLAUSE EXTRACTION
    // ========================================================================
    logStage('CLAUSE_EXTRACTION_START', { fileCount: fileUrls.length });
    
    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a lease analysis expert. Extract ALL clauses from this residential lease document.

FOR EACH CLAUSE/SECTION, provide:
- clause_id: The identifier (e.g., "3.2", "Section 5", "Article III", or generate "CLAUSE-001" if unnumbered)
- title: Heading/title if present (empty string if none)
- raw_text: Complete clause text (max 600 chars if very long)
- page_number: Estimated page number (1 if unsure)
- language: "th", "en", or "mixed"

ALSO EXTRACT these lease details:
- property_address (string, empty if not found)
- start_date (YYYY-MM-DD, empty if not found)
- end_date (YYYY-MM-DD, empty if not found)
- rent_amount (number, 0 if not found)
- deposit_amount (number, 0 if not found)
- notice_period_days (integer, 0 if not found)
- language_detected ("en", "th", or "mixed")
- rent_due_day (integer 1-31, 0 if not found)
- deposit_due_date (YYYY-MM-DD, empty if not found)
- deposit_return_days (integer days after lease end, 0 if not found)

Be thorough - extract every clause, even short ones.`,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          clauses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clause_id: { type: "string" },
                title: { type: "string" },
                raw_text: { type: "string" },
                page_number: { type: "integer" },
                language: { type: "string", enum: ["en", "th", "mixed"] }
              },
              required: ["clause_id", "raw_text"]
            }
          },
          property_address: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string" },
          rent_amount: { type: "number" },
          deposit_amount: { type: "number" },
          language_detected: { type: "string", enum: ["en", "th", "mixed"] },
          notice_period_days: { type: "integer" },
          rent_due_day: { type: "integer" },
          deposit_due_date: { type: "string" },
          deposit_return_days: { type: "integer" }
        },
        required: ["clauses"]
      }
    });

    const clauses = extractionResult.clauses || [];
    const basicInfo = {
      property_address: extractionResult.property_address || '',
      start_date: extractionResult.start_date || '',
      end_date: extractionResult.end_date || '',
      rent_amount: extractionResult.rent_amount || 0,
      deposit_amount: extractionResult.deposit_amount || 0,
      language_detected: extractionResult.language_detected || 'en',
      notice_period_days: extractionResult.notice_period_days || 0,
      rent_due_day: extractionResult.rent_due_day || 0,
      deposit_due_date: extractionResult.deposit_due_date || '',
      deposit_return_days: extractionResult.deposit_return_days || 0
    };

    logStage('CLAUSES_EXTRACTED', { 
      count: clauses.length,
      language: basicInfo.language_detected
    });

    // ========================================================================
    // PHASE 2: MULTI-ENGINE RISK DETECTION
    // ========================================================================
    logStage('RISK_ANALYSIS_START', { engines: 6 });
    
    const detectedIssues = [];
    const debugLog = {
      clauses_analyzed: clauses.length,
      engines_run: [],
      rules_triggered: []
    };

    const userLang = user.language || 'en';
    const monthlyRent = basicInfo.rent_amount;

    // ENGINE 1: LEGALITY
    logStage('ENGINE_1_LEGALITY', {});
    debugLog.engines_run.push('LEGALITY');
    
    LEGALITY_RULES.forEach(rule => {
      clauses.forEach(clause => {
        const matched = rule.patterns.some(pattern => pattern.test(clause.raw_text));
        if (matched) {
          debugLog.rules_triggered.push({ engine: 'LEGALITY', rule: rule.id, clause: clause.clause_id });
          
          detectedIssues.push({
            pattern_id: rule.id,
            title: userLang === 'th' ? rule.title_th : rule.title_en,
            severity: rule.severity,
            category: rule.category,
            description: userLang === 'th' ? rule.explanation_th : rule.explanation_en,
            evidence: clause.raw_text.substring(0, 300),
            explanation: userLang === 'th' ? rule.why_th : rule.why_en,
            recommendation: userLang === 'th' ? rule.recommendation_th : rule.recommendation_en,
            clause_id: clause.clause_id,
            page_number: clause.page_number,
            original_language: clause.language
          });
        }
      });
    });

    // ENGINE 2: PROCEDURAL TRAPS
    logStage('ENGINE_2_PROCEDURAL', {});
    debugLog.engines_run.push('PROCEDURAL');
    
    PROCEDURAL_RULES.forEach(rule => {
      clauses.forEach(clause => {
        const matched = rule.patterns.some(pattern => pattern.test(clause.raw_text));
        if (matched) {
          debugLog.rules_triggered.push({ engine: 'PROCEDURAL', rule: rule.id, clause: clause.clause_id });
          
          detectedIssues.push({
            pattern_id: rule.id,
            title: userLang === 'th' ? rule.title_th : rule.title_en,
            severity: rule.severity,
            category: rule.category,
            description: userLang === 'th' ? rule.explanation_th : rule.explanation_en,
            evidence: clause.raw_text.substring(0, 300),
            explanation: userLang === 'th' ? rule.why_th : rule.why_en,
            recommendation: userLang === 'th' ? rule.recommendation_th : rule.recommendation_en,
            clause_id: clause.clause_id,
            page_number: clause.page_number,
            original_language: clause.language
          });
        }
      });
    });

    // ENGINE 3: FINANCIAL EXPOSURE
    logStage('ENGINE_3_FINANCIAL', {});
    debugLog.engines_run.push('FINANCIAL');
    
    FINANCIAL_RULES.forEach(rule => {
      clauses.forEach(clause => {
        const matched = rule.patterns.some(pattern => pattern.test(clause.raw_text));
        if (matched) {
          debugLog.rules_triggered.push({ engine: 'FINANCIAL', rule: rule.id, clause: clause.clause_id });
          
          // Evaluate penalties within this clause
          const penalties = evaluatePenalties(clause.raw_text, monthlyRent, userLang);
          const maxSeverity = penalties.length > 0 
            ? penalties.reduce((max, p) => {
                const order = { critical: 3, high: 2, medium: 1, low: 0 };
                return (order[p.severity] || 0) > (order[max] || 0) ? p.severity : max;
              }, rule.severity)
            : rule.severity;
          
          detectedIssues.push({
            pattern_id: rule.id,
            title: userLang === 'th' ? rule.title_th : rule.title_en,
            severity: maxSeverity,
            category: rule.category,
            description: userLang === 'th' ? rule.explanation_th : rule.explanation_en,
            evidence: clause.raw_text.substring(0, 300),
            explanation: userLang === 'th' ? rule.why_th : rule.why_en,
            recommendation: userLang === 'th' ? rule.recommendation_th : rule.recommendation_en,
            clause_id: clause.clause_id,
            page_number: clause.page_number,
            original_language: clause.language,
            penalties: penalties.length > 0 ? penalties : undefined
          });
        }
      });
    });

    // ENGINE 4: POWER IMBALANCE
    logStage('ENGINE_4_POWER_IMBALANCE', {});
    debugLog.engines_run.push('POWER_IMBALANCE');
    
    POWER_IMBALANCE_RULES.forEach(rule => {
      clauses.forEach(clause => {
        const matched = rule.patterns.some(pattern => pattern.test(clause.raw_text));
        if (matched) {
          debugLog.rules_triggered.push({ engine: 'POWER_IMBALANCE', rule: rule.id, clause: clause.clause_id });
          
          detectedIssues.push({
            pattern_id: rule.id,
            title: userLang === 'th' ? rule.title_th : rule.title_en,
            severity: rule.severity,
            category: rule.category,
            description: userLang === 'th' ? rule.explanation_th : rule.explanation_en,
            evidence: clause.raw_text.substring(0, 300),
            explanation: userLang === 'th' ? rule.why_th : rule.why_en,
            recommendation: userLang === 'th' ? rule.recommendation_th : rule.recommendation_en,
            clause_id: clause.clause_id,
            page_number: clause.page_number,
            original_language: clause.language
          });
        }
      });
    });

    // ENGINE 5: RIGHTS SUPPRESSION
    logStage('ENGINE_5_RIGHTS_SUPPRESSION', {});
    debugLog.engines_run.push('RIGHTS_SUPPRESSION');
    
    RIGHTS_SUPPRESSION_RULES.forEach(rule => {
      clauses.forEach(clause => {
        const matched = rule.patterns.some(pattern => pattern.test(clause.raw_text));
        if (matched) {
          debugLog.rules_triggered.push({ engine: 'RIGHTS_SUPPRESSION', rule: rule.id, clause: clause.clause_id });
          
          detectedIssues.push({
            pattern_id: rule.id,
            title: userLang === 'th' ? rule.title_th : rule.title_en,
            severity: rule.severity,
            category: rule.category,
            description: userLang === 'th' ? rule.explanation_th : rule.explanation_en,
            evidence: clause.raw_text.substring(0, 300),
            explanation: userLang === 'th' ? rule.why_th : rule.why_en,
            recommendation: userLang === 'th' ? rule.recommendation_th : rule.recommendation_en,
            clause_id: clause.clause_id,
            page_number: clause.page_number,
            original_language: clause.language
          });
        }
      });
    });

    // ENGINE 6: MISSING SAFEGUARDS
    logStage('ENGINE_6_MISSING_SAFEGUARDS', {});
    debugLog.engines_run.push('MISSING_SAFEGUARDS');
    
    MISSING_SAFEGUARDS_RULES.forEach(rule => {
      if (rule.check && rule.check(basicInfo)) {
        debugLog.rules_triggered.push({ engine: 'MISSING_SAFEGUARDS', rule: rule.id });
        
        detectedIssues.push({
          pattern_id: rule.id,
          title: userLang === 'th' ? rule.title_th : rule.title_en,
          severity: rule.severity,
          category: rule.category,
          description: userLang === 'th' ? rule.explanation_th : rule.explanation_en,
          evidence: 'Not explicitly stated in lease',
          explanation: userLang === 'th' ? rule.why_th : rule.why_en,
          recommendation: userLang === 'th' ? rule.recommendation_th : rule.recommendation_en,
          missing_safeguard: true
        });
      }
      
      // Also check patterns
      if (rule.patterns) {
        clauses.forEach(clause => {
          const matched = rule.patterns.some(pattern => pattern.test(clause.raw_text));
          if (matched) {
            debugLog.rules_triggered.push({ engine: 'MISSING_SAFEGUARDS', rule: rule.id, clause: clause.clause_id });
            
            detectedIssues.push({
              pattern_id: rule.id,
              title: userLang === 'th' ? rule.title_th : rule.title_en,
              severity: rule.severity,
              category: rule.category,
              description: userLang === 'th' ? rule.explanation_th : rule.explanation_en,
              evidence: clause.raw_text.substring(0, 300),
              explanation: userLang === 'th' ? rule.why_th : rule.why_en,
              recommendation: userLang === 'th' ? rule.recommendation_th : rule.recommendation_en,
              clause_id: clause.clause_id,
              page_number: clause.page_number,
              original_language: clause.language
            });
          }
        });
      }
    });

    // ========================================================================
    // PHASE 3: COMPOUND RISK DETECTION
    // ========================================================================
    logStage('COMPOUND_DETECTION_START', {});
    
    const compoundRisks = detectCompoundRisks(clauses, userLang);
    compoundRisks.forEach(risk => {
      debugLog.rules_triggered.push({ engine: 'COMPOUND', rule: risk.id });
      detectedIssues.push(risk);
    });

    logStage('COMPOUND_DETECTED', { count: compoundRisks.length });

    // ========================================================================
    // PHASE 4: PREDATORY LANGUAGE ANALYSIS
    // ========================================================================
    logStage('PREDATORY_LANGUAGE_START', {});
    
    const fullText = clauses.map(c => c.raw_text).join(' ');
    const predatoryRisk = analyzePredatoryLanguage(fullText, userLang);
    
    if (predatoryRisk) {
      debugLog.rules_triggered.push({ engine: 'PREDATORY_LANGUAGE', score: predatoryRisk.predatory_score });
      detectedIssues.push(predatoryRisk);
    }

    // ========================================================================
    // PHASE 5: DEDUPLICATION (keep distinct risks only)
    // ========================================================================
    const uniqueIssues = [];
    const seen = new Set();
    
    detectedIssues.forEach(issue => {
      const key = `${issue.pattern_id}-${issue.clause_id || 'global'}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueIssues.push(issue);
      }
    });

    logStage('DEDUPLICATION', { before: detectedIssues.length, after: uniqueIssues.length });

    // ========================================================================
    // PHASE 6: RISK SCORE CALCULATION
    // ========================================================================
    const severityWeights = { critical: 25, high: 15, medium: 8, low: 3 };
    let rawScore = uniqueIssues.reduce((sum, issue) => sum + (severityWeights[issue.severity] || 5), 0);
    const riskScore = Math.min(100, Math.max(0, rawScore));

    const criticalCount = uniqueIssues.filter(i => i.severity === 'critical').length;
    const highCount = uniqueIssues.filter(i => i.severity === 'high').length;
    const mediumCount = uniqueIssues.filter(i => i.severity === 'medium').length;

    // ========================================================================
    // PHASE 7: SUMMARY GENERATION
    // ========================================================================
    let summary = '';
    if (userLang === 'th') {
      if (criticalCount >= 3) {
        summary = `วิเคราะห์พบปัญหาร้ายแรง ${criticalCount} รายการ, ปัญหาสูง ${highCount} รายการ และปัญหาปานกลาง ${mediumCount} รายการ สัญญานี้มีความเสี่ยงสูงมากต่อผู้เช่า ควรตรวจสอบอย่างละเอียดและเจรจาปรับแก้ก่อนเซ็น`;
      } else if (highCount >= 5) {
        summary = `พบปัญหาสูง ${highCount} รายการและปัญหาปานกลาง ${mediumCount} รายการ สัญญามีข้อกำหนดหลายข้อที่เอื้อประโยชน์ต่อเจ้าของบ้าน แนะนำให้ขอปรับแก้`;
      } else {
        summary = `พบปัญหา ${uniqueIssues.length} รายการที่ควรทบทวน ตรวจสอบข้อแนะนำก่อนเซ็นสัญญา`;
      }
    } else {
      if (criticalCount >= 3) {
        summary = `Analysis found ${criticalCount} critical, ${highCount} high-risk, and ${mediumCount} medium-risk issues. This lease poses significant risk to the tenant. Detailed review and negotiation strongly recommended before signing.`;
      } else if (highCount >= 5) {
        summary = `Found ${highCount} high-risk and ${mediumCount} medium-risk issues. Lease contains multiple landlord-favoring terms. Negotiation recommended.`;
      } else {
        summary = `Found ${uniqueIssues.length} issues worth reviewing. Check recommendations before signing.`;
      }
    }

    logStage('ANALYSIS_COMPLETE', {
      totalIssues: uniqueIssues.length,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      riskScore
    });

    // DEBUG VALIDATION
    if (uniqueIssues.length < 10) {
      logStage('WARNING_LOW_DETECTION', { 
        count: uniqueIssues.length,
        message: 'Expected 16+ issues for comprehensive scan'
      });
    }

    return Response.json({
      success: true,
      result: {
        risk_score: riskScore,
        summary,
        flags: uniqueIssues,
        property_address: basicInfo.property_address,
        start_date: basicInfo.start_date,
        end_date: basicInfo.end_date,
        rent_amount: basicInfo.rent_amount,
        deposit_amount: basicInfo.deposit_amount,
        language_detected: basicInfo.language_detected,
        notice_period_days: basicInfo.notice_period_days,
        rent_due_day: basicInfo.rent_due_day,
        deposit_due_date: basicInfo.deposit_due_date,
        deposit_return_days: basicInfo.deposit_return_days
      },
      debug: {
        ...debugLog,
        clauses_extracted: clauses,
        severity_distribution: { critical: criticalCount, high: highCount, medium: mediumCount },
        risk_score_raw: rawScore,
        risk_score_final: riskScore
      },
      diagnostic: {
        buildTag: "multi-engine-v2.0-production",
        scanId,
        requestId,
        filesProcessed: fileUrls.length,
        totalDuration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logStage('ERROR', { error: error.message, stack: error.stack });
    
    if (body.leaseId) {
      await base44.asServiceRole.entities.Lease.update(body.leaseId, { status: 'failed' });
    }
    
    return Response.json({ 
      success: false,
      error: error.message,
      diagnostic: {
        scanId,
        requestId,
        errorCategory: 'ANALYSIS_ERROR',
        duration: Date.now() - startTime
      }
    }, { status: 500 });
  }
});