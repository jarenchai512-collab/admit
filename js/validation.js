/**
 * ระบบตรวจสอบความถูกต้องของข้อมูล (Form Validation)
 * วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา 2570
 */

const Validator = {
  /**
   * ตรวจสอบความถูกต้องของเลขประจำตัวประชาชนไทย 13 หลัก (Checksum Algorithm)
   * @param {string} id - เลขประจำตัวประชาชน 13 หลัก
   * @returns {boolean}
   */
  validateThaiID(id) {
    if (!id) return false;
    // ลบช่องว่างและขีดออก
    const cleanId = id.toString().replace(/[-\s]/g, '');
    if (cleanId.length !== 13) return false;
    if (!/^[0-9]{13}$/.test(cleanId)) return false;

    // คำนวณ Checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanId.charAt(i), 10) * (13 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(cleanId.charAt(12), 10);
  },

  /**
   * ตรวจสอบหมายเลขโทรศัพท์ (10 หลัก เริ่มต้นด้วย 0)
   * @param {string} phone
   * @returns {boolean}
   */
  validatePhone(phone) {
    if (!phone) return false;
    const cleanPhone = phone.toString().replace(/[-\s]/g, '');
    return /^0[0-9]{9}$/.test(cleanPhone);
  },

  /**
   * ตรวจสอบผลการเรียนเฉลี่ยสะสม (0.00 - 4.00)
   * @param {number|string} gpax
   * @returns {boolean}
   */
  validateGPAX(gpax) {
    if (gpax === undefined || gpax === null || gpax === '') return false;
    const val = parseFloat(gpax);
    if (isNaN(val)) return false;
    return val >= 0.00 && val <= 4.00;
  },

  /**
   * จัดรูปแบบเลขบัตรประชาชน (X-XXXX-XXXXX-XX-X)
   * @param {string} id
   * @returns {string}
   */
  formatThaiID(id) {
    if (!id) return '';
    const clean = id.toString().replace(/\D/g, '').substring(0, 13);
    if (clean.length <= 1) return clean;
    if (clean.length <= 5) return `${clean.substring(0, 1)}-${clean.substring(1)}`;
    if (clean.length <= 10) return `${clean.substring(0, 1)}-${clean.substring(1, 5)}-${clean.substring(5)}`;
    if (clean.length <= 12) return `${clean.substring(0, 1)}-${clean.substring(1, 5)}-${clean.substring(5, 10)}-${clean.substring(10)}`;
    return `${clean.substring(0, 1)}-${clean.substring(1, 5)}-${clean.substring(5, 10)}-${clean.substring(10, 12)}-${clean.substring(12, 13)}`;
  },

  /**
   * จัดรูปแบบหมายเลขโทรศัพท์ (0XX-XXX-XXXX)
   * @param {string} phone
   * @returns {string}
   */
  formatPhone(phone) {
    if (!phone) return '';
    const clean = phone.toString().replace(/\D/g, '').substring(0, 10);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.substring(0, 3)}-${clean.substring(3)}`;
    return `${clean.substring(0, 3)}-${clean.substring(3, 6)}-${clean.substring(6, 10)}`;
  },

  /**
   * แปลงเลขอารบิกเป็นเลขไทย
   * @param {string|number} num
   * @returns {string}
   */
  toThaiDigits(num) {
    if (num === null || num === undefined) return '';
    const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
    return num.toString().replace(/[0-9]/g, digit => thaiDigits[parseInt(digit, 10)]);
  },

  /**
   * ตรวจสอบไฟล์อัปโหลด (ขนาดไม่เกิน 5 MB, ประเภท JPG, PNG, PDF)
   * @param {File} file
   * @returns {{ valid: boolean, error?: string }}
   */
  validateFile(file) {
    if (!file) return { valid: false, error: 'ไม่พบไฟล์' };
    const maxSize = 5 * 1024 * 1024; // 5 MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

    if (file.size > maxSize) {
      return { valid: false, error: 'ขนาดไฟล์เกิน 5 MB กรุณาเลือกไฟล์ใหม่' };
    }
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะ JPG, PNG และ PDF เท่านั้น' };
    }
    return { valid: true };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validator;
}
