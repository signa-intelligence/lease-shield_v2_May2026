import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TAXONOMY_VERSION = 'TH_RES_V1';
const FALLBACK_TAXONOMY = {
  version: TAXONOMY_VERSION,
  categories: [
    { category_id: 'THR_UTIL_DISCONNECT', name_en: 'Utility Disconnection', name_th: 'การตัดค่าสาธารณูปโภค', description_en: 'Threats or remedies allowing cutting utilities', severity_default: 'HIGH', triggers: [
        'disconnect\\s*utilities', 'cut (water|electricity)', 'terminate utilities', 'งดจ่ายน้ำ', 'ตัดน้ำ', 'ตัดไฟ'
      ], rules: [], recommended_actions_en: ['Prohibit disconnection as remedy; use lawful processes'], recommended_actions_th: ['ห้ามการตัดน้ำตัดไฟ ให้ใช้กระบวนการที่ชอบด้วยกฎหมาย'] },
    { category_id: 'THR_NOTICE_TRAP', name_en: 'Notice Method Trap', name_th: 'กับดักวิธีการแจ้ง', description_en: 'Dual/confirmation-only traps invalidating common channels', severity_default: 'MEDIUM', triggers: [
        'registered mail', 'email only', 'confirmed delivery', 'deemed received', 'ไปรษณีย์ลงทะเบียน', 'อีเมล', 'ยืนยันการรับ'
      ], rules: [], recommended_actions_en: ['Allow common channels; deeming rules fair'], recommended_actions_th: ['อนุญาตช่องทางทั่วไป กำหนดกติกายุติธรรม'] },
    { category_id: 'THR_AUTO_RENEW_ENTRAP', name_en: 'Auto-Renewal Entrapment', name_th: 'การต่ออายุอัตโนมัติ', description_en: 'Hidden auto-renew with onerous notice', severity_default: 'HIGH', triggers: ['auto-?renew', 'ต่ออายุอัตโนมัติ', 'renew automatically'], rules: [], recommended_actions_en: ['Prominent notice and opt-in'], recommended_actions_th: ['แจ้งชัดเจนและยืนยันความยินยอม'] },
    { category_id: 'THR_PENALTY_DAILY', name_en: 'Daily Penalties', name_th: 'ค่าปรับรายวัน', description_en: 'Per-day fines', severity_default: 'HIGH', triggers: ['per day', '/day', 'daily penalty', 'วันละ', 'ต่อวัน'], rules: [], recommended_actions_en: ['Cap and grace period'], recommended_actions_th: ['กำหนดเพดานและระยะผ่อนผัน'] },
    { category_id: 'THR_PENALTY_MULTIPLIER', name_en: 'Penalty Multipliers', name_th: 'ค่าปรับแบบทวีคูณ', description_en: '2x/3x multipliers (holdover etc.)', severity_default: 'CRITICAL', triggers: ['(\\b|\u0E2D)2x|3x|times|เท่า'], rules: [], recommended_actions_en: ['Remove multiplier; use actual damages'], recommended_actions_th: ['ยกเลิกตัวคูณ ใช้ค่าเสียหายตามจริง'] },
    { category_id: 'THR_PENALTY_FIXED_MINIMUM', name_en: 'Fixed/Minimum Fees', name_th: 'ค่าธรรมเนียมตายตัว/ขั้นต่ำ', description_en: 'Fixed or minimum fines', severity_default: 'HIGH', triggers: ['minimum', 'ไม่น้อยกว่า', 'fixed fee'], rules: [], recommended_actions_en: ['Set reasonable cap and thresholds'], recommended_actions_th: ['กำหนดเพดานที่เหมาะสม'] },
    { category_id: 'THR_DEPOSIT_DISCRETION', name_en: 'Deposit Discretion', name_th: 'ดุลยพินิจมัดจำ', description_en: 'Sole discretion, alleged breach, forfeiture', severity_default: 'HIGH', triggers: ['sole discretion', 'ดุลยพินิจ', 'alleged', 'กล่าวอ้าง', 'forfeit', 'forfeited', 'ริบ'], rules: [], recommended_actions_en: ['Objective criteria + itemized deductions'], recommended_actions_th: ['เกณฑ์วัตถุวิสัย + รายการหักอย่างชัดเจน'] },
    { category_id: 'THR_EARLY_TERMINATION_FORFEIT', name_en: 'Early Termination Forfeit', name_th: 'ยกเลิกก่อนกำหนดริบเงิน', description_en: 'Forfeit deposits/advance on early termination', severity_default: 'HIGH', triggers: ['forfeit', 'ริบ', 'early termination'], rules: [], recommended_actions_en: ['Pro-rata and fair settlement'], recommended_actions_th: ['คิดตามส่วนและยุติธรรม'] },
    { category_id: 'THR_PRIVACY_ACCESS', name_en: 'Privacy & Access', name_th: 'ความเป็นส่วนตัวและการเข้าถึง', description_en: 'Unrestricted entry/monitoring', severity_default: 'HIGH', triggers: ['unrestricted entry', 'enter anytime', 'เข้าห้องได้ตลอด', 'ตรวจสอบกล้อง'], rules: [], recommended_actions_en: ['Notice + consent except emergencies'], recommended_actions_th: ['แจ้งล่วงหน้าและขอความยินยอม ยกเว้นฉุกเฉิน'] },
    { category_id: 'THR_USE_SHORT_TERM_LETTING', name_en: 'Short-term Letting Ban', name_th: 'ห้ามปล่อยเช่ารายวัน', description_en: 'Short-term/daily bans often with termination/no refund', severity_default: 'HIGH', triggers: ['short-term', 'daily rental', 'รายวัน', 'ต่ำกว่า 30 วัน', 'immediate termination', 'ทันที'], rules: [], recommended_actions_en: ['Clarify scope and cure period'], recommended_actions_th: ['กำหนดขอบเขตและระยะเวลาแก้ไข'] },
    { category_id: 'THR_USE_SUBLEASE_ASSIGN', name_en: 'Sublease/Assignment Ban', name_th: 'ห้ามเช่าช่วง/โอนสิทธิ', description_en: 'No sublease/assignment with penalties/termination', severity_default: 'MEDIUM', triggers: ['sublease', 'assign', 'โอนสิทธิ', 'ให้เช่าช่วง'], rules: [], recommended_actions_en: ['Allow with consent or fees; cure'], recommended_actions_th: ['อนุญาตโดยมีเงื่อนไข/ค่าธรรมเนียม และโอกาสแก้ไข'] },
    { category_id: 'THR_USE_COMMERCIAL_WFH', name_en: 'Overbroad WFH/Commercial', name_th: 'ข้อจำกัดทำงานที่บ้าน/เชิงพาณิชย์เกินจำเป็น', description_en: 'Overbroad restrictions', severity_default: 'LOW', triggers: ['work from home', 'WFH', 'พาณิชย์', 'ประกอบธุรกิจ'], rules: [], recommended_actions_en: ['Permit low-impact WFH'], recommended_actions_th: ['อนุญาตการทำงานที่บ้านที่ไม่กระทบ'] },
    { category_id: 'THR_ABANDONED_PROPERTY', name_en: 'Abandoned Property', name_th: 'ทรัพย์สินถูกทิ้ง/จำหน่าย', description_en: 'Short disposal windows', severity_default: 'HIGH', triggers: ['abandoned', 'dispose', 'ทิ้ง', 'ยึดทรัพย์', 'จำหน่าย', '24 hours'], rules: [], recommended_actions_en: ['Reasonable window + notice'], recommended_actions_th: ['กำหนดระยะเวลาเหมาะสมและแจ้งเตือน'] },
    { category_id: 'THR_MISSING_SAFEGUARDS', name_en: 'Missing Safeguards', name_th: 'ขาดหลักประกันสำคัญ', description_en: 'No deposit return timeline, inventory, itemized deductions, dispute path', severity_default: 'MEDIUM', triggers: ['no inventory', 'no itemized', 'ไม่คืนภายใน', 'ไม่มีรายการหัก'], rules: [], recommended_actions_en: ['Add timelines and process'], recommended_actions_th: ['กำหนดระยะเวลาและกระบวนการ'] },
    { category_id: 'THR_ENFORCEMENT_ASYMMETRY', name_en: 'Enforcement Asymmetry', name_th: 'การบังคับใช้ไม่สมดุล', description_en: 'One-sided remedies/no cure', severity_default: 'HIGH', triggers: ['immediate termination', 'ทันที', 'no refund', 'ไม่คืนเงิน'], rules: [], recommended_actions_en: ['Add cure periods and balanced remedies'], recommended_actions_th: ['กำหนดโอกาสแก้ไขและมาตรการที่สมดุล'] }
  ]
};

function validateTaxonomy(t){
  if (!t || !Array.isArray(t.categories)) return false;
  const required = new Set([
    'THR_UTIL_DISCONNECT','THR_NOTICE_TRAP','THR_AUTO_RENEW_ENTRAP','THR_PENALTY_DAILY','THR_PENALTY_MULTIPLIER','THR_PENALTY_FIXED_MINIMUM','THR_DEPOSIT_DISCRETION','THR_EARLY_TERMINATION_FORFEIT','THR_PRIVACY_ACCESS','THR_USE_SHORT_TERM_LETTING','THR_USE_SUBLEASE_ASSIGN','THR_USE_COMMERCIAL_WFH','THR_ABANDONED_PROPERTY','THR_MISSING_SAFEGUARDS','THR_ENFORCEMENT_ASYMMETRY'
  ]);
  t.categories.forEach(c => required.delete(c.category_id));
  return required.size === 0;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Prefer active taxonomy from DB
    const list = await base44.asServiceRole.entities.RiskTaxonomy.filter({ status: 'active' });
    const active = Array.isArray(list) ? list.find(x => x.version === TAXONOMY_VERSION) || list[0] : null;
    const taxonomy = active?.taxonomy && validateTaxonomy(active.taxonomy) ? active.taxonomy : FALLBACK_TAXONOMY;
    return Response.json({ success: true, taxonomy });
  } catch (e) {
    return Response.json({ success: true, taxonomy: FALLBACK_TAXONOMY, warning: e.message });
  }
});