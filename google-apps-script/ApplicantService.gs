/**
 * ระบบรับสมัครเรียนออนไลน์ (โควตา) วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา ๒๕๗๐
 * ไฟล์: ApplicantService.gs - บริการงานรับสมัครและการจัดการข้อมูลผู้สมัคร
 */

/**
 * ดึงการตั้งค่าทั้งหมดจากชีต Settings
 */
function getSystemSettings() {
  var ss = getDb();
  var sheet = ss.getSheetByName('Settings');
  if (!sheet) return { success: false, message: 'ไม่พบชีต Settings' };

  var data = sheet.getDataRange().getValues();
  var settings = {};

  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    var val = data[i][1];
    if (key === 'isOpen') {
      settings[key] = (val === true || val === 'true');
    } else if (key === 'majorsVocational' || key === 'majorsHighVocational') {
      try {
        settings[key] = JSON.parse(val);
      } catch (e) {
        settings[key] = [];
      }
    } else {
      settings[key] = val;
    }
  }

  return { success: true, data: settings };
}

/**
 * บันทึกการตั้งค่าลงในชีต Settings (Admin)
 */
function saveSystemSettings(newSettings) {
  var ss = getDb();
  var sheet = ss.getSheetByName('Settings');
  if (!sheet) return { success: false, message: 'ไม่พบชีต Settings' };

  var data = sheet.getDataRange().getValues();
  var now = new Date();

  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    if (newSettings[key] !== undefined) {
      var valToSave = newSettings[key];
      if (key === 'majorsVocational' || key === 'majorsHighVocational') {
        valToSave = JSON.stringify(valToSave);
      } else if (typeof valToSave === 'boolean') {
        valToSave = valToSave ? 'true' : 'false';
      }
      sheet.getRange(i + 1, 2).setValue(valToSave);
      sheet.getRange(i + 1, 4).setValue(now);
    }
  }

  return { success: true, message: 'บันทึกการตั้งค่าสำเร็จ' };
}

/**
 * ตรวจสอบการสมัครซ้ำด้วยเลขประจำตัวประชาชน
 */
function checkDuplicateApplicant(idCard, academicYear) {
  var ss = getDb();
  var sheet = ss.getSheetByName('Applicants');
  if (!sheet || sheet.getLastRow() <= 1) {
    return { success: true, exists: false };
  }

  var cleanId = idCard.toString().replace(/[-\s]/g, '');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var rowId = data[i][8].toString().replace(/[-\s]/g, '');
    var rowYear = data[i][1].toString();
    if (rowId === cleanId && rowYear === academicYear) {
      return {
        success: true,
        exists: true,
        applicationId: data[i][0]
      };
    }
  }

  return { success: true, exists: false };
}

/**
 * ตรวจสอบความถูกต้องของเลขประจำตัวประชาชน (Thai National ID Checksum)
 */
function verifyThaiID(id) {
  var cleanId = id.toString().replace(/[-\s]/g, '');
  if (cleanId.length !== 13 || !/^[0-9]{13}$/.test(cleanId)) return false;

  var sum = 0;
  for (var i = 0; i < 12; i++) {
    sum += parseInt(cleanId.charAt(i), 10) * (13 - i);
  }
  var checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(cleanId.charAt(12), 10);
}

/**
 * จัดการการยื่นใบสมัครใหม่
 */
function handleApplicantSubmission(payload) {
  var cleanId = payload.idCard.toString().replace(/[-\s]/g, '');

  // 1. ตรวจสอบ Checksum
  if (!verifyThaiID(cleanId)) {
    return { success: false, message: 'เลขประจำตัวประชาชนไม่ถูกต้องตามหลักการคำนวณ' };
  }

  // 2. ตรวจสอบการสมัครซ้ำ
  var dupCheck = checkDuplicateApplicant(cleanId, '2570');
  if (dupCheck.exists) {
    return {
      success: false,
      message: 'เลขประจำตัวประชาชนนี้ได้ทำการสมัครเรียนในปีการศึกษา ๒๕๗๐ แล้ว (เลขที่สมัคร: ' + dupCheck.applicationId + ')'
    };
  }

  var ss = getDb();
  var sheetApplicants = ss.getSheetByName('Applicants');
  var sheetLogs = ss.getSheetByName('StatusLog');

  // 3. สร้างเลขที่ใบสมัครต่อเนื่อง เช่น Q70-0001
  var lastRow = sheetApplicants.getLastRow();
  var nextNum = lastRow; // เนื่องจากแถว 1 คือ Header
  var yearSuffix = '70';
  var appId = 'Q' + yearSuffix + '-' + ('0000' + nextNum).slice(-4);

  // 4. บันทึกไฟล์แนบลงใน Google Drive ผ่าน DocumentService
  var documentsData = {};
  if (payload.documents) {
    documentsData = saveApplicantDocumentsToDrive(appId, payload.documents);
  }

  var now = new Date();
  var fullName = ((payload.prefix || '') + payload.firstName + ' ' + payload.lastName).trim();

  // 5. บันทึกลงในชีต Applicants
  var newRow = [
    appId,
    '2570',
    payload.level,
    payload.prefix,
    payload.firstName,
    payload.lastName,
    fullName,
    payload.birthDate,
    cleanId,
    payload.fatherName,
    payload.fatherAge || '',
    payload.fatherJob,
    payload.motherName,
    payload.motherAge || '',
    payload.motherJob,
    payload.houseNo,
    payload.moo || '',
    payload.soi || '',
    payload.road || '',
    payload.subdistrict,
    payload.district,
    payload.province,
    payload.postalCode,
    payload.phone,
    payload.currentGrade,
    payload.schoolName,
    payload.schoolLocation,
    payload.gpax,
    payload.oldMajor || '',
    payload.majorChoice1,
    payload.majorChoice2 || '',
    'รอตรวจสอบ',
    'ยื่นใบสมัครออนไลน์เรียบร้อย รอเจ้าหน้าที่ตรวจสอบเอกสาร',
    '', // student_id
    '', // enrolled_date
    now,
    now
  ];

  sheetApplicants.appendRow(newRow);

  // 6. บันทึกลง StatusLog
  sheetLogs.appendRow([
    'LOG-' + new Date().getTime(),
    appId,
    '-',
    'รอตรวจสอบ',
    'ระบบรับสมัครออนไลน์',
    'system',
    'ผู้สมัครยื่นใบสมัครออนไลน์',
    now
  ]);

  var applicantObject = {
    id: appId,
    academicYear: '2570',
    level: payload.level,
    prefix: payload.prefix,
    firstName: payload.firstName,
    lastName: payload.lastName,
    fullName: fullName,
    birthDate: payload.birthDate,
    idCard: cleanId,
    fatherName: payload.fatherName,
    fatherAge: payload.fatherAge,
    fatherJob: payload.fatherJob,
    motherName: payload.motherName,
    motherAge: payload.motherAge,
    motherJob: payload.motherJob,
    houseNo: payload.houseNo,
    moo: payload.moo,
    soi: payload.soi,
    road: payload.road,
    subdistrict: payload.subdistrict,
    district: payload.district,
    province: payload.province,
    postalCode: payload.postalCode,
    phone: payload.phone,
    currentGrade: payload.currentGrade,
    schoolName: payload.schoolName,
    schoolLocation: payload.schoolLocation,
    gpax: payload.gpax,
    oldMajor: payload.oldMajor,
    majorChoice1: payload.majorChoice1,
    majorChoice2: payload.majorChoice2,
    status: 'รอตรวจสอบ',
    notes: 'ยื่นใบสมัครออนไลน์เรียบร้อย รอเจ้าหน้าที่ตรวจสอบเอกสาร',
    documents: documentsData,
    createdAt: Utilities.formatDate(now, 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss')
  };

  // 7. ส่งแจ้งเตือนงานทะเบียน (LINE Notify / Email)
  sendNotificationOnNewApplicant(applicantObject);

  return {
    success: true,
    applicationId: appId,
    data: applicantObject,
    message: 'บันทึกใบสมัครสำเร็จ'
  };
}

/**
 * ดึงรายชื่อผู้สมัครทั้งหมดสำหรับฝ่ายทะเบียน
 */
function getAllApplicants() {
  var ss = getDb();
  var sheet = ss.getSheetByName('Applicants');
  if (!sheet || sheet.getLastRow() <= 1) {
    return { success: true, data: [] };
  }

  var data = sheet.getDataRange().getValues();
  var applicants = [];

  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    applicants.push({
      id: r[0],
      academicYear: r[1],
      level: r[2],
      prefix: r[3],
      firstName: r[4],
      lastName: r[5],
      fullName: r[6],
      birthDate: r[7],
      idCard: r[8],
      fatherName: r[9],
      fatherAge: r[10],
      fatherJob: r[11],
      motherName: r[12],
      motherAge: r[13],
      motherJob: r[14],
      houseNo: r[15],
      moo: r[16],
      soi: r[17],
      road: r[18],
      subdistrict: r[19],
      district: r[20],
      province: r[21],
      postalCode: r[22],
      phone: r[23],
      currentGrade: r[24],
      schoolName: r[25],
      schoolLocation: r[26],
      gpax: r[27],
      oldMajor: r[28],
      majorChoice1: r[29],
      majorChoice2: r[30],
      status: r[31],
      notes: r[32],
      studentId: r[33],
      enrolledDate: r[34] ? Utilities.formatDate(new Date(r[34]), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss') : '',
      createdAt: r[35] ? Utilities.formatDate(new Date(r[35]), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss') : ''
    });
  }

  return { success: true, data: applicants };
}

/**
 * ตรวจสอบสถานะผู้สมัครผ่านเลขประจำตัวประชาชน
 */
function getApplicantStatus(idCard) {
  var ss = getDb();
  var sheet = ss.getSheetByName('Applicants');
  if (!sheet || sheet.getLastRow() <= 1) {
    return { success: false, message: 'ไม่พบข้อมูลการสมัคร' };
  }

  var cleanId = idCard.toString().replace(/[-\s]/g, '');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (r[8].toString().replace(/[-\s]/g, '') === cleanId) {
      return {
        success: true,
        data: {
          id: r[0],
          fullName: r[6],
          level: r[2],
          majorChoice1: r[29],
          majorChoice2: r[30] || '-',
          status: r[31],
          notes: r[32] || '-',
          studentId: r[33] || '',
          createdAt: r[35] ? Utilities.formatDate(new Date(r[35]), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss') : ''
        }
      };
    }
  }

  return { success: false, message: 'ไม่พบข้อมูลการสมัครเรียนของเลขประจำตัวประชาชนนี้' };
}
