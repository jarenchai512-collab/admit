/**
 * ระบบรับสมัครเรียนออนไลน์ (โควตา) วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา ๒๕๗๐
 * ไฟล์: Code.gs - ตัวจัดการหลัก (Main Controller & Web App Handler)
 */

// รหัส Google Spreadsheet ฐานข้อมูล (หากว่างไว้ ระบบจะใช้ Active Spreadsheet ที่ผูกกับสคริปต์นี้)
var SPREADSHEET_ID = "";

/**
 * ฟังก์ชันบริการ GET สำหรับ Web App
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif; padding:20px; text-align:center;">' +
    '<h2>ระบบรับสมัครเรียนออนไลน์ (โควตา) ๒๕๗๐</h2>' +
    '<h3>วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์</h3>' +
    '<p>Backend Web App API พร้อมให้บริการ</p>' +
    '</div>'
  ).setTitle('ระบบรับสมัครเรียนออนไลน์ โควตา ๒๕๗๐ - วท.ท่าหลวงฯ');
}

/**
 * ฟังก์ชันบริการ POST รับคำขอ API จาก Frontend (Single Page Application)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // รอล็อคไม่เกิน 30 วินาที เพื่อป้องกัน Race Condition ในการออกเลขที่ใบสมัคร
  lock.tryLock(30000);

  try {
    var requestData = {};
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    }

    var action = requestData.action;
    var result = { success: false, message: 'ไม่ระบุคำสั่ง (action)' };

    switch (action) {
      // 1. ดึงการตั้งค่าระบบและรายชื่อสาขาวิชา
      case 'getSettings':
        result = getSystemSettings();
        break;

      // 2. ตรวจสอบเลขประจำตัวประชาชนซ้ำ
      case 'checkDuplicateID':
        result = checkDuplicateApplicant(requestData.idCard, requestData.academicYear || '2570');
        break;

      // 3. ยื่นใบสมัครใหม่
      case 'submitApplication':
        result = handleApplicantSubmission(requestData);
        break;

      // 4. ตรวจสอบสถานะผู้สมัคร
      case 'checkStatus':
        result = getApplicantStatus(requestData.idCard);
        break;

      // 5. ผู้สมัครอัปโหลดเอกสารแก้ไขเพิ่มเติม
      case 'reuploadDocument':
        result = handleDocumentReupload(requestData);
        break;

      // 6. ล็อกอินเจ้าหน้าที่
      case 'staffLogin':
        result = handleStaffLogin(requestData.username, requestData.password);
        break;

      // 7. ดึงรายการผู้สมัครทั้งหมด (สำหรับเจ้าหน้าที่)
      case 'getApplicants':
        result = getAllApplicants();
        break;

      // 8. ปรับปรุงสถานะผู้สมัคร
      case 'updateStatus':
        result = updateApplicantStatus(requestData);
        break;

      // 9. ดึงประวัติการเปลี่ยนสถานะ (Audit Log)
      case 'getStatusLogs':
        result = getStatusAuditLogs(requestData.applicationId);
        break;

      // 10. บันทึกการตั้งค่าระบบ (Admin Only)
      case 'updateSettings':
        result = saveSystemSettings(requestData.settings);
        break;

      default:
        result = { success: false, message: 'ไม่พบคำสั่งการทำงาน: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * ดึงออบเจ็กต์ Google Spreadsheet ที่ใช้งาน
 */
function getDb() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}
