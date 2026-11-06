/**
 * ระบบรับสมัครเรียนออนไลน์ (โควตา) วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา ๒๕๗๐
 * ไฟล์: Setup.gs - สคริปต์ติดตั้งโครงสร้างฐานข้อมูล ๕ ชีตและโฟลเดอร์ Google Drive
 */

/**
 * ฟังก์ชันติดตั้งระบบ (เรียกใช้เพียงครั้งแรกเพื่อสร้างตารางและค่าเริ่มต้นทั้งหมด)
 */
function setupDatabase() {
  var ss = getDb();

  // 1. สร้างชีต Applicants (ทะเบียนผู้สมัคร)
  var sheetApplicants = getOrCreateSheet(ss, 'Applicants');
  var headerApplicants = [
    'application_id', 'academic_year', 'level', 'prefix', 'first_name', 'last_name',
    'full_name', 'birth_date', 'id_card', 'father_name', 'father_age', 'father_job',
    'mother_name', 'mother_age', 'mother_job', 'house_no', 'moo', 'soi', 'road',
    'subdistrict', 'district', 'province', 'postal_code', 'phone', 'current_grade',
    'school_name', 'school_location', 'gpax', 'old_major', 'major_choice_1', 'major_choice_2',
    'status', 'notes', 'student_id', 'enrolled_date', 'created_at', 'updated_at'
  ];
  styleHeader(sheetApplicants, headerApplicants);

  // 2. สร้างชีต Documents (รายการไฟล์แนบใน Google Drive)
  var sheetDocs = getOrCreateSheet(ss, 'Documents');
  var headerDocs = [
    'doc_id', 'application_id', 'doc_type', 'file_name', 'drive_file_id',
    'drive_url', 'uploaded_at', 'verified'
  ];
  styleHeader(sheetDocs, headerDocs);

  // 3. สร้างชีต StatusLog (ประวัติการเปลี่ยนแปลงสถานะ / Audit Trail)
  var sheetLogs = getOrCreateSheet(ss, 'StatusLog');
  var headerLogs = [
    'log_id', 'application_id', 'old_status', 'new_status', 'changed_by',
    'role', 'notes', 'timestamp'
  ];
  styleHeader(sheetLogs, headerLogs);

  // 4. สร้างชีต Staff (บัญชีผู้ใช้งานฝ่ายทะเบียนและผู้ดูแลระบบ)
  var sheetStaff = getOrCreateSheet(ss, 'Staff');
  var headerStaff = [
    'staff_id', 'username', 'password_hash', 'full_name', 'role',
    'department', 'status', 'last_login'
  ];
  styleHeader(sheetStaff, headerStaff);

  // เพิ่มบัญชีเจ้าหน้าที่ตั้งต้น หากยังไม่มี
  if (sheetStaff.getLastRow() === 1) {
    sheetStaff.appendRow([
      'STF-001', 'admin', 'password123', 'นายอดุลย์ บริหารทะเบียน', 'admin',
      'งานทะเบียนและประมวลผล', 'active', ''
    ]);
    sheetStaff.appendRow([
      'STF-002', 'officer', 'password123', 'นางสมศรี งานทะเบียน', 'officer',
      'งานรับสมัครนักเรียนนักศึกษา', 'active', ''
    ]);
  }

  // 5. สร้างชีต Settings (ตั้งค่าระบบและรายชื่อสาขาวิชา)
  var sheetSettings = getOrCreateSheet(ss, 'Settings');
  var headerSettings = ['setting_key', 'setting_value', 'description', 'updated_at'];
  styleHeader(sheetSettings, headerSettings);

  // บันทึกค่าตั้งต้นลงใน Settings
  var defaultSettings = [
    ['isOpen', 'true', 'สถานะการเปิดรับสมัครออนไลน์ (true/false)'],
    ['academicYear', '2570', 'ปีการศึกษาที่เปิดรับสมัคร'],
    ['startDate', '2027-01-05', 'วันเริ่มต้นรับสมัคร'],
    ['endDate', '2027-02-28', 'วันสิ้นสุดรับสมัคร'],
    ['announcementTitle', 'ประกาศรับสมัครนักเรียน นักศึกษาใหม่ ประเภทโควตา ประจำปีการศึกษา ๒๕๗๐', 'หัวข้อประกาศหน้าแรก'],
    ['announcementBody', 'วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ มีความประสงค์เปิดรับสมัครบุคคลเพื่อเข้าศึกษาต่อในระดับประกาศนียบัตรวิชาชีพ (ปวช.) และระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.) ประเภทโควตา ประจำปีการศึกษา ๒๕๗๐ ผู้สนใจสามารถยื่นใบสมัครออนไลน์ได้ตั้งแต่วันนี้ถึงวันที่ ๒๘ กุมภาพันธ์ ๒๕๗๐', 'รายละเอียดประกาศหน้าแรก'],
    ['quotaQualifications', 'สำเร็จการศึกษาหรือกำลังศึกษาอยู่ในระดับ ม.3, ปวช.3 หรือ ม.6 มีผลการเรียนเฉลี่ยสะสม (GPAX) ไม่ต่ำกว่า 2.00 มีความประพฤติเรียบร้อยและมีหนังสือรับรองจากสถานศึกษาเดิม', 'เกณฑ์คุณสมบัติโควตา'],
    ['majorsVocational', JSON.stringify([
      'เทคโนโลยีสารสนเทศ', 'การบัญชี', 'เทคโนโลยีธุรกิจดิจิทัล', 'การตลาด', 'ไฟฟ้ากำลัง',
      'อิเล็กทรอนิกส์', 'เทคนิคคอมพิวเตอร์', 'เทคนิคการผลิต', 'ซ่อมบำรุงอุตสาหกรรม', 'ยานยนต์', 'เมคคาทรอนิกส์'
    ]), 'รายชื่อสาขาวิชา ระดับ ปวช.'],
    ['majorsHighVocational', JSON.stringify([
      'เทคโนโลยีสารสนเทศ', 'การบัญชี', 'เทคโนโลยีธุรกิจดิจิทัล', 'การตลาด', 'ไฟฟ้ากำลัง',
      'อิเล็กทรอนิกส์', 'เทคโนโลยีคอมพิวเตอร์', 'เทคนิคการผลิต', 'ซ่อมบำรุงอุตสาหกรรม', 'ยานยนต์', 'เมคคาทรอนิกส์'
    ]), 'รายชื่อสาขาวิชา ระดับ ปวส.'],
    ['driveFolderId', '', 'รหัสโฟลเดอร์ Google Drive เก็บไฟล์แนบ'],
    ['lineNotifyToken', '', 'Token สำหรับส่งแจ้งเตือน LINE Notify เมื่อมีผู้สมัครใหม่'],
    ['adminEmail', 'saraban@tl.ac.th', 'อีเมลสำหรับรับการแจ้งเตือนงานทะเบียน']
  ];

  if (sheetSettings.getLastRow() === 1) {
    var now = new Date();
    defaultSettings.forEach(function(item) {
      sheetSettings.appendRow([item[0], item[1], item[2], now]);
    });
  }

  // สร้างโฟลเดอร์ Google Drive สำหรับเก็บเอกสารผู้สมัครโดยเฉพาะ
  var folderName = "เอกสารรับสมัครโควตา_2570_วท.ท่าหลวงฯ";
  var folders = DriveApp.getFoldersByName(folderName);
  var targetFolder;
  if (folders.hasNext()) {
    targetFolder = folders.next();
  } else {
    targetFolder = DriveApp.createFolder(folderName);
  }

  // อัปเดตรหัสโฟลเดอร์ลงใน Settings
  var settingsData = sheetSettings.getDataRange().getValues();
  for (var r = 1; r < settingsData.length; r++) {
    if (settingsData[r][0] === 'driveFolderId') {
      sheetSettings.getRange(r + 1, 2).setValue(targetFolder.getId());
      break;
    }
  }

  Logger.log('ติดตั้งฐานข้อมูลสำเร็จ โฟลเดอร์ Drive ID: ' + targetFolder.getId());
  return 'ติดตั้งฐานข้อมูล ๕ ชีต และโฟลเดอร์ Drive สำเร็จเรียบร้อยแล้ว';
}

/**
 * ฟังก์ชันช่วยสร้างชีตหรือคืนค่าชีตเดิม
 */
function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * จัดรูปแบบหัวตารางให้เป็นระเบียบตามมาตรฐานงานทะเบียน
 */
function styleHeader(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setBackground('#1F3A5F');
    range.setFontColor('#FFFFFF');
    range.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}
