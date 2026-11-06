/**
 * ระบบรับสมัครเรียนออนไลน์ (โควตา) วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา ๒๕๗๐
 * ไฟล์: StatusService.gs - บริการจัดการสถานะ การมอบตัว และการตรวจสอบสิทธิ์เจ้าหน้าที่
 */

/**
 * จัดการเข้าสู่ระบบของเจ้าหน้าที่
 */
function handleStaffLogin(username, password) {
  var ss = getDb();
  var sheet = ss.getSheetByName('Staff');
  if (!sheet || sheet.getLastRow() <= 1) {
    return { success: false, message: 'ไม่พบฐานข้อมูลเจ้าหน้าที่' };
  }

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (r[1] === username && r[2] === password && r[6] === 'active') {
      // บันทึกเวลาเข้าใช้งานล่าสุด
      sheet.getRange(i + 1, 8).setValue(new Date());

      return {
        success: true,
        staff: {
          staffId: r[0],
          username: r[1],
          fullName: r[3],
          role: r[4],
          department: r[5],
          token: 'TOKEN-' + new Date().getTime()
        }
      };
    }
  }

  return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ' };
}

/**
 * ปรับปรุงสถานะการคัดเลือกของผู้สมัคร
 */
function updateApplicantStatus(payload) {
  var appId = payload.applicationId;
  var newStatus = payload.newStatus;
  var notes = payload.notes || '';
  var staffName = payload.staffName || 'เจ้าหน้าที่';
  var staffRole = payload.staffRole || 'officer';
  var sendNotify = payload.sendNotify !== false;

  var ss = getDb();
  var sheetApplicants = ss.getSheetByName('Applicants');
  var sheetLogs = ss.getSheetByName('StatusLog');

  if (!sheetApplicants || sheetApplicants.getLastRow() <= 1) {
    return { success: false, message: 'ไม่พบฐานข้อมูลผู้สมัคร' };
  }

  var data = sheetApplicants.getDataRange().getValues();
  var foundIndex = -1;
  var oldStatus = '';
  var currentStudentId = '';
  var applicantPhone = '';
  var applicantName = '';

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === appId) {
      foundIndex = i + 1; // row number in sheet
      oldStatus = data[i][31];
      currentStudentId = data[i][33];
      applicantName = data[i][6];
      applicantPhone = data[i][23];
      break;
    }
  }

  if (foundIndex === -1) {
    return { success: false, message: 'ไม่พบใบสมัครรหัส: ' + appId };
  }

  var now = new Date();
  var generatedStudentId = currentStudentId;

  // หากเปลี่ยนสถานะเป็น "มอบตัวแล้ว" และยังไม่มีรหัสนักเรียน ให้ออกรหัสนักเรียนอัตโนมัติ
  // รูปแบบ: 7020901xxxx (70 ปีการศึกษา + 20901 รหัสวิทยาลัยเทคนิคท่าหลวงฯ + ลำดับ 4 หลัก)
  if (newStatus === 'มอบตัวแล้ว' && (!generatedStudentId || generatedStudentId === '')) {
    var countEnrolled = 1;
    for (var k = 1; k < data.length; k++) {
      if (data[k][33] && data[k][33] !== '') {
        countEnrolled++;
      }
    }
    generatedStudentId = '7020901' + ('0000' + countEnrolled).slice(-4);
    sheetApplicants.getRange(foundIndex, 34).setValue(generatedStudentId); // student_id
    sheetApplicants.getRange(foundIndex, 35).setValue(now); // enrolled_date
  }

  // อัปเดตสถานะและหมายเหตุ
  sheetApplicants.getRange(foundIndex, 32).setValue(newStatus); // status
  sheetApplicants.getRange(foundIndex, 33).setValue(notes); // notes
  sheetApplicants.getRange(foundIndex, 37).setValue(now); // updated_at

  // บันทึกลงประวัติการเปลี่ยนแปลง StatusLog
  sheetLogs.appendRow([
    'LOG-' + now.getTime(),
    appId,
    oldStatus,
    newStatus,
    staffName,
    staffRole,
    notes,
    now
  ]);

  // ส่งแจ้งเตือนเมื่อสถานะเปลี่ยน
  if (sendNotify) {
    sendNotificationOnStatusChange({
      applicationId: appId,
      fullName: applicantName,
      oldStatus: oldStatus,
      newStatus: newStatus,
      notes: notes,
      studentId: generatedStudentId,
      phone: applicantPhone
    });
  }

  return {
    success: true,
    studentId: generatedStudentId,
    message: 'ปรับปรุงสถานะสำเร็จ'
  };
}

/**
 * ดึงประวัติการเปลี่ยนสถานะของผู้สมัคร (Audit Logs)
 */
function getStatusAuditLogs(applicationId) {
  var ss = getDb();
  var sheet = ss.getSheetByName('StatusLog');
  if (!sheet || sheet.getLastRow() <= 1) {
    return { success: true, data: [] };
  }

  var data = sheet.getDataRange().getValues();
  var logs = [];

  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!applicationId || r[1] === applicationId) {
      logs.push({
        id: r[0],
        applicationId: r[1],
        oldStatus: r[2],
        newStatus: r[3],
        changedBy: r[4],
        role: r[5],
        notes: r[6],
        timestamp: Utilities.formatDate(new Date(r[7]), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss')
      });
    }
  }

  // เรียงลำดับจากล่าสุดไปเก่าสุด
  logs.reverse();

  return { success: true, data: logs };
}
