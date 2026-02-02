import type { ValidationRule } from '../types.js';
import { walkText } from '../walker.js';

/**
 * Default blocked patterns that indicate prompt injection attempts.
 *
 * Patterns are designed to avoid matching legitimate security documentation
 * that uses negative phrasing like "never disable security" or "don't bypass".
 *
 * NOTE: Default patterns are in English only. For multilingual support,
 * use the language-specific pattern sets exported from this module or
 * configure custom patterns via ValidatorConfig.blockedPatterns.
 */
const DEFAULT_BLOCKED_PATTERNS: RegExp[] = [
  // Original patterns - these are fairly unique to prompt injection
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /pretend\s+(you\s+)?(are|to\s+be)/i,
  /jailbreak/i,
  /bypass\s+(your\s+)?(rules|restrictions)/i,
  /disregard\s+(all\s+)?(prior|previous)/i,
  /forget\s+(all\s+)?(prior|previous|your)/i,
  /act\s+as\s+if\s+you\s+(have\s+)?no\s+restrictions/i,

  // New patterns - imperative commands to do unsafe things
  // Note: These use word boundaries and avoid matching defensive phrasing
  /(?:^|[.!?]\s*)(?:please\s+)?override\s+safety/im,
  /(?:^|[.!?]\s*)(?:please\s+)?suppress\s+(?:all\s+)?warnings?/im,
  /(?:^|[.!?]\s*)(?:please\s+)?hide\s+security/im,
  /(?:you\s+)?(?:should|must|can|will)\s+disable\s+(?:safety|security)/i,
  /(?:you\s+)?(?:should|must|can|will)\s+turn\s+off\s+(?:safety|security)/i,
  /(?:you\s+)?(?:should|must|can|will)\s+circumvent\s+(?:safety|security)/i,
  /(?:^|[.!?]\s*)evade\s+(?:detection|monitoring|logging)/im,
  /(?:^|[.!?]\s*)delete\s+(?:all\s+)?(?:logs?|audit\s+trail)/im,
];

/**
 * Polish (Polski) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_PL: RegExp[] = [
  /zignoruj\s+(wszystkie\s+)?poprzednie\s+instrukcje/i,
  /udawaj,?\s+że\s+(jesteś|nie\s+masz)/i,
  /omiń\s+(swoje\s+)?(zasady|ograniczenia|restrykcje)/i,
  /zapomnij\s+(o\s+)?(wszystkich\s+)?(poprzednich|wcześniejszych)/i,
  /pomiń\s+(wszystkie\s+)?zabezpieczenia/i,
  /wyłącz\s+(tryb\s+)?bezpieczeństwa/i,
  /ukryj\s+(wszystkie\s+)?ostrzeżenia/i,
  /usuń\s+(wszystkie\s+)?logi/i,
  /nadpisz\s+zasady\s+bezpieczeństwa/i,
  /działaj\s+bez\s+ograniczeń/i,
];

/**
 * Spanish (Español) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_ES: RegExp[] = [
  /ignora\s+(todas?\s+las?\s+)?instrucciones\s+anteriores/i,
  /finge\s+(que\s+)?(eres|ser)/i,
  /elude\s+(tus\s+)?(reglas|restricciones)/i,
  /olvida\s+(todas?\s+las?\s+)?(anteriores|previas)/i,
  /desactiva\s+(la\s+)?seguridad/i,
  /oculta\s+(las\s+)?advertencias/i,
  /elimina\s+(los\s+)?registros/i,
  /anula\s+(las\s+)?medidas\s+de\s+seguridad/i,
  /actúa\s+sin\s+restricciones/i,
  /salta(r)?\s+(las\s+)?restricciones/i,
];

/**
 * German (Deutsch) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_DE: RegExp[] = [
  /ignoriere?\s+(alle\s+)?vorherigen?\s+(Anweisungen|Instruktionen)/i,
  /tu\s+so,?\s+als\s+(ob\s+du|wärst\s+du)/i,
  /umgehe?\s+(deine\s+)?(Regeln|Einschränkungen|Beschränkungen)/i,
  /vergiss\s+(alle\s+)?(vorherigen?|früheren?)/i,
  /deaktiviere?\s+(die\s+)?Sicherheit/i,
  /verstecke?\s+(alle\s+)?Warnungen/i,
  /lösche?\s+(alle\s+)?(Logs?|Protokolle?)/i,
  /überschreibe?\s+(die\s+)?Sicherheitsregeln/i,
  /handel[en]?\s+ohne\s+Einschränkungen/i,
  /Sicherheitsmaßnahmen\s+umgehen/i,
];

/**
 * French (Français) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_FR: RegExp[] = [
  /ignore[zr]?\s+(toutes?\s+les?\s+)?instructions?\s+(précédentes?|antérieures?)/i,
  /fais\s+semblant\s+(d['']être|que\s+tu\s+es)/i,
  /contourne[zr]?\s+(tes|vos)\s+(règles|restrictions)/i,
  /oublie[zr]?\s+(toutes?\s+les?\s+)?(précédentes?|antérieures?)/i,
  /désactive[zr]?\s+(la\s+)?sécurité/i,
  /cache[zr]?\s+(les\s+)?avertissements/i,
  /supprime[zr]?\s+(les\s+)?(logs?|journaux?)/i,
  /outrepasse[zr]?\s+(les\s+)?mesures\s+de\s+sécurité/i,
  /agis\s+sans\s+restrictions/i,
  /ignore[zr]?\s+(les\s+)?limites/i,
];

/**
 * Portuguese (Português) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_PT: RegExp[] = [
  /ignore\s+(todas?\s+as?\s+)?instruções\s+anteriores/i,
  /finja\s+(que\s+)?(você\s+é|ser)/i,
  /contorne\s+(suas?\s+)?(regras|restrições)/i,
  /esqueça\s+(todas?\s+as?\s+)?(anteriores|prévias)/i,
  /desative\s+(a\s+)?segurança/i,
  /oculte\s+(os\s+)?avisos/i,
  /apague\s+(os\s+)?(logs?|registros?)/i,
  /substitua\s+(as\s+)?medidas\s+de\s+segurança/i,
  /aja\s+sem\s+restrições/i,
  /pule\s+(as\s+)?restrições/i,
];

/**
 * Russian (Русский) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_RU: RegExp[] = [
  /игнорируй\s+(все\s+)?предыдущие\s+инструкции/i,
  /притворись,?\s+(что\s+)?(ты|будто)/i,
  /обойди\s+(свои\s+)?(правила|ограничения)/i,
  /забудь\s+(все\s+)?(предыдущие|прошлые)/i,
  /отключи\s+безопасность/i,
  /скрой\s+(все\s+)?предупреждения/i,
  /удали\s+(все\s+)?(логи|журналы)/i,
  /переопредели\s+правила\s+безопасности/i,
  /действуй\s+без\s+ограничений/i,
  /пропусти\s+проверки\s+безопасности/i,
];

/**
 * Chinese Simplified (简体中文) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_ZH: RegExp[] = [
  /忽略\s*(所有\s*)?之前的指令/i,
  /假装\s*(你是|成为)/i,
  /绕过\s*(你的\s*)?(规则|限制|约束)/i,
  /忘记\s*(所有\s*)?(之前|以前)的/i,
  /禁用\s*安全/i,
  /隐藏\s*(所有\s*)?警告/i,
  /删除\s*(所有\s*)?(日志|记录)/i,
  /覆盖\s*安全\s*(规则|措施)/i,
  /无限制\s*(地\s*)?运行/i,
  /跳过\s*安全检查/i,
];

/**
 * Italian (Italiano) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_IT: RegExp[] = [
  /ignora\s+(tutte\s+le\s+)?istruzioni\s+precedenti/i,
  /fingi\s+di\s+(essere|non\s+avere)/i,
  /aggira\s+(le\s+tue\s+)?(regole|restrizioni)/i,
  /dimentica\s+(tutte\s+le\s+)?(precedenti|passate)/i,
  /disattiva\s+(la\s+)?sicurezza/i,
  /nascondi\s+(gli\s+)?avvisi/i,
  /elimina\s+(i\s+)?(log|registri)/i,
  /sovrascrivi\s+(le\s+)?misure\s+di\s+sicurezza/i,
  /agisci\s+senza\s+restrizioni/i,
  /salta\s+(le\s+)?restrizioni/i,
];

/**
 * Dutch (Nederlands) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_NL: RegExp[] = [
  /negeer\s+(alle\s+)?vorige\s+(instructies|aanwijzingen)/i,
  /doe\s+alsof\s+je\s+(bent|geen)/i,
  /omzeil\s+(je\s+)?(regels|beperkingen)/i,
  /vergeet\s+(alle\s+)?(vorige|eerdere)/i,
  /schakel\s+(de\s+)?beveiliging\s+uit/i,
  /verberg\s+(alle\s+)?waarschuwingen/i,
  /verwijder\s+(alle\s+)?(logs?|logboeken)/i,
  /overschrijf\s+(de\s+)?beveiligingsregels/i,
  /handel\s+zonder\s+beperkingen/i,
  /sla\s+(de\s+)?beperkingen\s+over/i,
];

/**
 * Japanese (日本語) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_JA: RegExp[] = [
  /以前の指示を(すべて)?無視(して|しろ|せよ)/i,
  /ふりをして|なりすまして/i,
  /(ルール|制限|制約)を(回避|無視|バイパス)/i,
  /(以前|前)の(指示|命令)を忘れ/i,
  /セキュリティを(無効|オフ)に/i,
  /警告を(非表示|隠す|消す)/i,
  /ログを(削除|消去)/i,
  /セキュリティ(ルール|規則)を上書き/i,
  /制限なしで(動作|実行)/i,
  /安全チェックをスキップ/i,
];

/**
 * Korean (한국어) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_KO: RegExp[] = [
  /이전\s*(모든\s*)?지시(를|를\s+)?(무시|잊어)/i,
  /인\s*척\s*(해|하세요|해라)/i,
  /(규칙|제한|제약)(을|를)\s*(우회|무시|회피)/i,
  /(이전|과거)\s*(지시|명령)(을|를)\s*잊/i,
  /보안(을|를)\s*(비활성화|끄|해제)/i,
  /경고(를|를\s+)?(숨기|숨겨|가리)/i,
  /로그(를|를\s+)?(삭제|지우)/i,
  /보안\s*규칙(을|를)\s*덮어쓰/i,
  /제한\s*없이\s*(작동|실행)/i,
  /보안\s*검사(를|를\s+)?건너뛰/i,
];

/**
 * Arabic (العربية) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_AR: RegExp[] = [
  /تجاهل\s+(جميع\s+)?التعليمات\s+السابقة/i,
  /تظاهر\s+(أنك|بأنك)/i,
  /تجاوز\s+(القواعد|القيود)/i,
  /انسَ\s+(جميع\s+)?(السابق|التعليمات\s+السابقة)/i,
  /عطّل\s+الأمان/i,
  /أخفِ\s+(جميع\s+)?التحذيرات/i,
  /احذف\s+(جميع\s+)?السجلات/i,
  /تجاوز\s+قواعد\s+الأمان/i,
  /اعمل\s+بدون\s+قيود/i,
  /تخطَّ\s+فحوصات\s+الأمان/i,
];

/**
 * Turkish (Türkçe) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_TR: RegExp[] = [
  /önceki\s+(tüm\s+)?talimatları\s+(yoksay|görmezden\s+gel)/i,
  /gibi\s+davran|mış\s+gibi\s+yap/i,
  /(kuralları|kısıtlamaları)\s+(atla|geç|bypass)/i,
  /önceki(leri)?\s+unut/i,
  /güvenliği\s+(devre\s+dışı\s+bırak|kapat)/i,
  /uyarıları\s+(gizle|sakla)/i,
  /günlükleri\s+sil/i,
  /güvenlik\s+kurallarını\s+(geçersiz\s+kıl|üzerine\s+yaz)/i,
  /kısıtlama\s+olmadan\s+(çalış|hareket\s+et)/i,
  /güvenlik\s+kontrollerini\s+atla/i,
];

/**
 * Swedish (Svenska) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_SV: RegExp[] = [
  /ignorera\s+(alla\s+)?tidigare\s+(instruktioner|anvisningar)/i,
  /låtsas\s+(att\s+du\s+är|vara)/i,
  /kringgå\s+(dina\s+)?(regler|begränsningar)/i,
  /glöm\s+(alla\s+)?(tidigare|föregående)/i,
  /inaktivera\s+säkerhet(en)?/i,
  /dölj\s+(alla\s+)?varningar/i,
  /radera\s+(alla\s+)?loggar/i,
  /skriv\s+över\s+säkerhetsregler(na)?/i,
  /agera\s+utan\s+begränsningar/i,
  /hoppa\s+över\s+säkerhetskontroller/i,
];

/**
 * Norwegian (Norsk) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_NO: RegExp[] = [
  /ignorer\s+(alle\s+)?tidligere\s+(instruksjoner|anvisninger)/i,
  /lat\s+som\s+(om\s+)?du\s+(er|ikke\s+har)/i,
  /omgå\s+(dine\s+)?(regler|begrensninger)/i,
  /glem\s+(alle\s+)?(tidligere|foregående)/i,
  /deaktiver\s+sikkerhet(en)?/i,
  /skjul\s+(alle\s+)?advarsler/i,
  /slett\s+(alle\s+)?logger/i,
  /overskriv\s+sikkerhetsregler/i,
  /handle\s+uten\s+begrensninger/i,
  /hopp\s+over\s+sikkerhetssjekker/i,
];

/**
 * Danish (Dansk) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_DA: RegExp[] = [
  /ignorer\s+(alle\s+)?tidligere\s+(instruktioner|anvisninger)/i,
  /lad\s+som\s+om\s+du\s+(er|ikke\s+har)/i,
  /omgå\s+(dine\s+)?(regler|begrænsninger)/i,
  /glem\s+(alle\s+)?(tidligere|foregående)/i,
  /deaktiver\s+sikkerhed(en)?/i,
  /skjul\s+(alle\s+)?advarsler/i,
  /slet\s+(alle\s+)?logfiler/i,
  /overskriv\s+sikkerhedsregler/i,
  /handl\s+uden\s+begrænsninger/i,
  /spring\s+sikkerhedstjek\s+over/i,
];

/**
 * Finnish (Suomi) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_FI: RegExp[] = [
  /ohita\s+(kaikki\s+)?aiemmat\s+ohjeet/i,
  /teeskentele\s+(olevasi|että\s+olet)/i,
  /kierrä\s+(säännöt|rajoitukset)/i,
  /unohda\s+(kaikki\s+)?(aiemmat|edelliset)/i,
  /poista\s+turvallisuus\s+käytöstä/i,
  /piilota\s+(kaikki\s+)?varoitukset/i,
  /poista\s+(kaikki\s+)?lokit/i,
  /ylikirjoita\s+turvasäännöt/i,
  /toimi\s+ilman\s+rajoituksia/i,
  /ohita\s+turvatarkistukset/i,
];

/**
 * Czech (Čeština) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_CS: RegExp[] = [
  /ignoruj\s+(všechny\s+)?předchozí\s+(instrukce|pokyny)/i,
  /předstírej,?\s+že\s+(jsi|nemáš)/i,
  /obejdi\s+(svá\s+)?(pravidla|omezení)/i,
  /zapomeň\s+(na\s+)?(všechny\s+)?(předchozí|dřívější)/i,
  /vypni\s+bezpečnost/i,
  /skryj\s+(všechna\s+)?varování/i,
  /smaž\s+(všechny\s+)?logy/i,
  /přepiš\s+bezpečnostní\s+pravidla/i,
  /jednej\s+bez\s+omezení/i,
  /přeskoč\s+bezpečnostní\s+kontroly/i,
];

/**
 * Hungarian (Magyar) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_HU: RegExp[] = [
  /hagyd\s+figyelmen\s+kívül\s+(az\s+összes\s+)?korábbi\s+utasítást/i,
  /tegyél\s+úgy,?\s+mintha/i,
  /kerüld\s+meg\s+(a\s+)?(szabályokat|korlátozásokat)/i,
  /felejtsd\s+el\s+(az\s+összes\s+)?(korábbi|előző)/i,
  /kapcsold\s+ki\s+a\s+biztonságot/i,
  /rejtsd\s+el\s+(az\s+összes\s+)?figyelmeztetést/i,
  /töröld\s+(az\s+összes\s+)?naplót/i,
  /írd\s+felül\s+a\s+biztonsági\s+szabályokat/i,
  /cselekedj\s+korlátozások\s+nélkül/i,
  /hagyd\s+ki\s+a\s+biztonsági\s+ellenőrzéseket/i,
];

/**
 * Ukrainian (Українська) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_UK: RegExp[] = [
  /ігноруй\s+(всі\s+)?попередні\s+інструкції/i,
  /вдавай,?\s+(що\s+)?(ти|ніби)/i,
  /обійди\s+(свої\s+)?(правила|обмеження)/i,
  /забудь\s+(всі\s+)?(попередні|минулі)/i,
  /вимкни\s+безпеку/i,
  /сховай\s+(всі\s+)?попередження/i,
  /видали\s+(всі\s+)?(логи|журнали)/i,
  /перезапиши\s+правила\s+безпеки/i,
  /дій\s+без\s+обмежень/i,
  /пропусти\s+перевірки\s+безпеки/i,
];

/**
 * Hindi (हिन्दी) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_HI: RegExp[] = [
  /पिछले\s+(सभी\s+)?निर्देशों?\s+को\s+(अनदेखा|नज़रअंदाज़)\s+करो/i,
  /ऐसा\s+दिखावा\s+करो\s+(कि|जैसे)/i,
  /(नियमों|प्रतिबंधों)\s+को\s+(बायपास|दरकिनार)\s+करो/i,
  /पिछले\s+(सभी\s+)?(निर्देश|आदेश)\s+भूल\s+जाओ/i,
  /सुरक्षा\s+(को\s+)?(बंद|अक्षम)\s+करो/i,
  /(सभी\s+)?चेतावनियों?\s+को\s+छुपाओ/i,
  /(सभी\s+)?लॉग\s+(को\s+)?हटाओ/i,
  /सुरक्षा\s+नियमों\s+को\s+ओवरराइड\s+करो/i,
  /बिना\s+प्रतिबंध\s+के\s+काम\s+करो/i,
  /सुरक्षा\s+जांच\s+को\s+छोड़\s+दो/i,
];

/**
 * Indonesian (Bahasa Indonesia) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_ID: RegExp[] = [
  /abaikan\s+(semua\s+)?instruksi\s+sebelumnya/i,
  /berpura-pura\s+(menjadi|bahwa\s+kamu)/i,
  /lewati\s+(aturan|batasan|pembatasan)/i,
  /lupakan\s+(semua\s+)?(sebelumnya|yang\s+lalu)/i,
  /nonaktifkan\s+keamanan/i,
  /sembunyikan\s+(semua\s+)?peringatan/i,
  /hapus\s+(semua\s+)?log/i,
  /timpa\s+aturan\s+keamanan/i,
  /bertindak\s+tanpa\s+batasan/i,
  /lewati\s+pemeriksaan\s+keamanan/i,
];

/**
 * Vietnamese (Tiếng Việt) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_VI: RegExp[] = [
  /bỏ\s+qua\s+(tất\s+cả\s+)?hướng\s+dẫn\s+trước/i,
  /giả\s+vờ\s+(là|rằng\s+bạn)/i,
  /vượt\s+qua\s+(các\s+)?(quy\s+tắc|hạn\s+chế)/i,
  /quên\s+(tất\s+cả\s+)?(trước\s+đó|trước)/i,
  /tắt\s+bảo\s+mật/i,
  /ẩn\s+(tất\s+cả\s+)?cảnh\s+báo/i,
  /xóa\s+(tất\s+cả\s+)?nhật\s+ký/i,
  /ghi\s+đè\s+quy\s+tắc\s+bảo\s+mật/i,
  /hành\s+động\s+không\s+hạn\s+chế/i,
  /bỏ\s+qua\s+kiểm\s+tra\s+bảo\s+mật/i,
];

/**
 * Thai (ไทย) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_TH: RegExp[] = [
  /เพิกเฉย\s*(คำสั่ง|คำแนะนำ)\s*ก่อนหน้า\s*(ทั้งหมด)?/i,
  /แกล้งทำ\s*(เป็น|ว่า)/i,
  /ข้าม\s*(กฎ|ข้อจำกัด)/i,
  /ลืม\s*(คำสั่ง|คำแนะนำ)\s*ก่อนหน้า\s*(ทั้งหมด)?/i,
  /ปิด\s*ความปลอดภัย/i,
  /ซ่อน\s*คำเตือน\s*(ทั้งหมด)?/i,
  /ลบ\s*บันทึก\s*(ทั้งหมด)?/i,
  /เขียนทับ\s*กฎความปลอดภัย/i,
  /ทำงาน\s*โดยไม่มี\s*ข้อจำกัด/i,
  /ข้าม\s*การตรวจสอบความปลอดภัย/i,
];

/**
 * Greek (Ελληνικά) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_EL: RegExp[] = [
  /αγνόησε\s+(όλες\s+τις\s+)?προηγούμενες\s+οδηγίες/i,
  /προσποιήσου\s+(ότι\s+είσαι|πως)/i,
  /παράκαμψε\s+(τους\s+)?(κανόνες|περιορισμούς)/i,
  /ξέχασε\s+(όλες\s+τις\s+)?(προηγούμενες|παλιές)/i,
  /απενεργοποίησε\s+την\s+ασφάλεια/i,
  /κρύψε\s+(όλες\s+τις\s+)?προειδοποιήσεις/i,
  /διάγραψε\s+(όλα\s+τα\s+)?αρχεία\s+καταγραφής/i,
  /αντικατάστησε\s+τους\s+κανόνες\s+ασφαλείας/i,
  /ενέργησε\s+χωρίς\s+περιορισμούς/i,
  /παράλειψε\s+τους\s+ελέγχους\s+ασφαλείας/i,
];

/**
 * Romanian (Română) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_RO: RegExp[] = [
  /ignoră\s+(toate\s+)?instrucțiunile\s+anterioare/i,
  /prefă-te\s+(că\s+ești|a\s+fi)/i,
  /ocolește\s+(regulile|restricțiile)/i,
  /uită\s+(toate\s+)?(anterioarele|precedentele)/i,
  /dezactivează\s+securitatea/i,
  /ascunde\s+(toate\s+)?avertismentele/i,
  /șterge\s+(toate\s+)?jurnalele/i,
  /suprascrie\s+regulile\s+de\s+securitate/i,
  /acționează\s+fără\s+restricții/i,
  /sari\s+peste\s+verificările\s+de\s+securitate/i,
];

/**
 * Hebrew (עברית) prompt injection patterns.
 */
export const BLOCKED_PATTERNS_HE: RegExp[] = [
  /התעלם\s+(מכל\s+)?ההוראות\s+הקודמות/i,
  /העמד\s+פנים\s+(שאתה|כאילו)/i,
  /עקוף\s+(את\s+)?(הכללים|ההגבלות)/i,
  /שכח\s+(את\s+כל\s+)?(הקודם|ההוראות\s+הקודמות)/i,
  /השבת\s+(את\s+)?האבטחה/i,
  /הסתר\s+(את\s+כל\s+)?האזהרות/i,
  /מחק\s+(את\s+כל\s+)?היומנים/i,
  /דרוס\s+(את\s+)?כללי\s+האבטחה/i,
  /פעל\s+ללא\s+הגבלות/i,
  /דלג\s+על\s+בדיקות\s+האבטחה/i,
];

/**
 * All multilingual patterns combined.
 * Use this for comprehensive international coverage.
 */
export const BLOCKED_PATTERNS_ALL_LANGUAGES: RegExp[] = [
  ...DEFAULT_BLOCKED_PATTERNS,
  ...BLOCKED_PATTERNS_PL,
  ...BLOCKED_PATTERNS_ES,
  ...BLOCKED_PATTERNS_DE,
  ...BLOCKED_PATTERNS_FR,
  ...BLOCKED_PATTERNS_PT,
  ...BLOCKED_PATTERNS_RU,
  ...BLOCKED_PATTERNS_ZH,
  ...BLOCKED_PATTERNS_IT,
  ...BLOCKED_PATTERNS_NL,
  ...BLOCKED_PATTERNS_JA,
  ...BLOCKED_PATTERNS_KO,
  ...BLOCKED_PATTERNS_AR,
  ...BLOCKED_PATTERNS_TR,
  ...BLOCKED_PATTERNS_SV,
  ...BLOCKED_PATTERNS_NO,
  ...BLOCKED_PATTERNS_DA,
  ...BLOCKED_PATTERNS_FI,
  ...BLOCKED_PATTERNS_CS,
  ...BLOCKED_PATTERNS_HU,
  ...BLOCKED_PATTERNS_UK,
  ...BLOCKED_PATTERNS_HI,
  ...BLOCKED_PATTERNS_ID,
  ...BLOCKED_PATTERNS_VI,
  ...BLOCKED_PATTERNS_TH,
  ...BLOCKED_PATTERNS_EL,
  ...BLOCKED_PATTERNS_RO,
  ...BLOCKED_PATTERNS_HE,
];

/**
 * PS005: Content must not contain blocked patterns
 */
export const blockedPatterns: ValidationRule = {
  id: 'PS005',
  name: 'blocked-patterns',
  description: 'Content must not contain blocked patterns (prompt injection prevention)',
  defaultSeverity: 'error',
  validate: (ctx) => {
    // Combine default patterns with custom patterns from config
    const patterns: RegExp[] = [
      ...DEFAULT_BLOCKED_PATTERNS,
      ...(ctx.config.blockedPatterns ?? []).map((p) =>
        typeof p === 'string' ? new RegExp(p, 'i') : p
      ),
    ];

    // Walk all text content and check against patterns
    walkText(ctx.ast, (text, loc) => {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          ctx.report({
            message: `Blocked pattern detected: ${pattern.source}`,
            location: loc,
            suggestion: 'Remove or rephrase the flagged content',
          });
        }
      }
    });
  },
};
