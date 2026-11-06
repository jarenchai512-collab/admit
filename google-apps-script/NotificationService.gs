/**
 * ระบบรับสมัครเรียนออนไลน์ (โควตา) วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา ๒๕๗๐
 * ไฟล์: NotificationService.gs - บริการส่งการแจ้งเตือนผ่าน LINE Notify และอีเมล
 */

/**
 * ส่งแจ้งเตือนเมื่อมีผู้สมัครยื่นใบสมัครใหม่
 * @param {object} app
 */
function sendNotificationOnNewApplicant(app) {
  var settings = getSystemSettings().data || {};
  var token = settings.lineNotifyToken;
  var adminEmail = settings.adminEmail || 'saraban@tl.ac.th';

  var message = '\n[ผู้สมัครโควตาใหม่ ๒๕๗๐]' +
    '\nวิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์' +
    '\n---------------------------------' +
    '\nเลขที่สมัคร: ' + app.id +
    '\nชื่อ-สกุล: ' + app.fullName +
    '\nระดับ: ' + app.level +
    '\nสาขาที่เลือก ๑: ' + app.majorChoice1 +
    (app.majorChoice2 ? '\nสาขาที่เลือก ๒: ' + app.majorChoice2 : '') +
    '\nเกรดเฉลี่ย (GPAX): ' + app.gpax +
    '\nโรงเรียนเดิม: ' + app.schoolName +
    '\nเบอร์โทรศัพท์: ' + app.phone +
    '\nเวลาที่สมัคร: ' + app.createdAt;

  // 1. ส่ง LINE Notify หากมีการตั้งค่า Token ไว้
  if (token && token.trim() !== "") {
    sendLineNotify(token, message);
  }

  // 2. ส่งอีเมลแจ้งเตือนฝ่ายทะเบียน
  if (adminEmail && adminEmail.trim() !== "") {
    try {
      MailApp.sendEmail({
        to: adminEmail,
        subject: 'แจ้งเตือนผู้สมัครโควตาใหม่ [' + app.id + '] ' + app.fullName + ' - วท.ท่าหลวงฯ',
        body: message
      });
    } catch (e) {
      Logger.log('ส่งอีเมลไม่สำเร็จ: ' + e.toString());
    }
  }
}

/**
 * ส่งแจ้งเตือนเมื่อสถานะของผู้สมัครเปลี่ยนไป
 * @param {object} info
 */
function sendNotificationOnStatusChange(info) {
  var settings = getSystemSettings().data || {};
  var token = settings.lineNotifyToken;

  var message = '\n[แจ้งผลการพิจารณาใบสมัครโควตา ๒๕๗๐]' +
    '\nวิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์' +
    '\n---------------------------------' +
    '\nเลขที่สมัคร: ' + info.applicationId +
    '\nชื่อผู้สมัคร: ' + info.fullName +
    '\nสถานะเดิม: ' + info.oldStatus +
    '\nสถานะใหม่: ' + info.newStatus +
    (info.studentId ? '\nรหัสประจำตัวนักเรียน: ' + info.studentId : '') +
    (info.notes ? '\nหมายเหตุ: ' + info.notes : '');

  if (token && token.trim() !== "") {
    sendLineNotify(token, message);
  }
}

/**
 * ฟังก์ชันส่งข้อความไปยัง LINE Notify API
 */
function sendLineNotify(token, message) {
  try {
    var url = 'https://notify-api.line.me/api/notify';
    var options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      payload: {
        'message': message
      },
      muteHttpExceptions: true
    };
    var response = UrlFetchApp.fetch(url, options);
    Logger.log('LINE Notify Response: ' + response.getContentText());
  } catch (err) {
    Logger.log('LINE Notify Error: ' + err.toString());
  }
}
