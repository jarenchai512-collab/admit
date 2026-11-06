/**
 * ระบบรับสมัครเรียนออนไลน์ (โควตา) วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา ๒๕๗๐
 * ไฟล์: DocumentService.gs - บริการจัดเก็บเอกสารหลักฐานใน Google Drive และชีต Documents
 */

/**
 * ดึงโฟลเดอร์ Google Drive สำหรับจัดเก็บไฟล์
 */
function getStorageFolder() {
  var settings = getSystemSettings().data || {};
  var folderId = settings.driveFolderId;

  if (folderId && folderId.trim() !== "") {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      Logger.log('ไม่พบโฟลเดอร์ตาม ID: ' + folderId + ' กำลังค้นหาตามชื่อ');
    }
  }

  var folderName = "เอกสารรับสมัครโควตา_2570_วท.ท่าหลวงฯ";
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

/**
 * บันทึกไฟล์เอกสารหลักฐานของผู้สมัครลงใน Google Drive
 * @param {string} appId - เลขที่ใบสมัคร เช่น Q70-0001
 * @param {object} documents - ออบเจ็กต์รายการไฟล์ Base64
 * @returns {object}
 */
function saveApplicantDocumentsToDrive(appId, documents) {
  var folder = getStorageFolder();
  var ss = getDb();
  var sheetDocs = ss.getSheetByName('Documents');
  var results = {};
  var now = new Date();

  // สร้างโฟลเดอร์ย่อยเฉพาะของผู้สมัครรายนั้นเพื่อความปลอดภัยและความเป็นระเบียบ
  var subFolder = folder.createFolder(appId);

  var docTypes = ['photo', 'transcript', 'idCopy', 'cert'];
  var typeLabels = {
    photo: 'รูปถ่าย๑นิ้ว',
    transcript: 'ผลการเรียนปพ๑',
    idCopy: 'สำเนาบัตรประชาชน',
    cert: 'เกียรติบัตร'
  };

  docTypes.forEach(function(type) {
    if (documents[type] && documents[type].url) {
      try {
        var fileData = documents[type].url;
        var originalName = documents[type].name || (type + '.jpg');

        // แยก MIME type และข้อมูล Base64
        var matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          var mimeType = matches[1];
          var base64Data = matches[2];
          var decodedBytes = Utilities.base64Decode(base64Data);

          var extension = originalName.split('.').pop() || 'dat';
          var newFileName = appId + '_' + typeLabels[type] + '.' + extension;

          var blob = Utilities.newBlob(decodedBytes, mimeType, newFileName);
          var driveFile = subFolder.createFile(blob);

          var docId = 'DOC-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);
          var fileUrl = driveFile.getUrl();

          // บันทึกลงชีต Documents
          if (sheetDocs) {
            sheetDocs.appendRow([
              docId,
              appId,
              type,
              newFileName,
              driveFile.getId(),
              fileUrl,
              now,
              'รอตรวจ'
            ]);
          }

          results[type] = {
            docId: docId,
            name: newFileName,
            url: fileUrl,
            fileId: driveFile.getId(),
            uploadedAt: Utilities.formatDate(now, 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss')
          };
        }
      } catch (err) {
        Logger.log('เกิดข้อผิดพลาดในการบันทึกไฟล์ ' + type + ': ' + err.toString());
      }
    }
  });

  return results;
}

/**
 * จัดการกรณีผู้สมัครอัปโหลดเอกสารแก้ไขเพิ่มเติม (เมื่อสถานะเป็น "เอกสารไม่ครบ")
 */
function handleDocumentReupload(payload) {
  var appId = payload.applicationId;
  var docType = payload.docType;
  var fileData = payload.fileData;
  var fileName = payload.fileName;

  if (!appId || !docType || !fileData) {
    return { success: false, message: 'ข้อมูลไม่ครบถ้วน' };
  }

  var folder = getStorageFolder();
  var subFolders = folder.getFoldersByName(appId);
  var targetSubFolder;

  if (subFolders.hasNext()) {
    targetSubFolder = subFolders.next();
  } else {
    targetSubFolder = folder.createFolder(appId);
  }

  var matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { success: false, message: 'รูปแบบไฟล์ไม่ถูกต้อง' };
  }

  var mimeType = matches[1];
  var base64Data = matches[2];
  var decodedBytes = Utilities.base64Decode(base64Data);

  var extension = fileName.split('.').pop() || 'dat';
  var newFileName = appId + '_' + docType + '_แก้ไข_' + new Date().getTime() + '.' + extension;
  var blob = Utilities.newBlob(decodedBytes, mimeType, newFileName);
  var driveFile = targetSubFolder.createFile(blob);

  var now = new Date();
  var ss = getDb();
  var sheetDocs = ss.getSheetByName('Documents');
  var sheetApplicants = ss.getSheetByName('Applicants');
  var sheetLogs = ss.getSheetByName('StatusLog');

  // บันทึกลง Documents
  sheetDocs.appendRow([
    'DOC-' + now.getTime(),
    appId,
    docType,
    newFileName,
    driveFile.getId(),
    driveFile.getUrl(),
    now,
    'อัปโหลดแก้ไขใหม่'
  ]);

  // ปรับปรุงสถานะใน Applicants เป็น "รอตรวจสอบ"
  var appData = sheetApplicants.getDataRange().getValues();
  for (var i = 1; i < appData.length; i++) {
    if (appData[i][0] === appId) {
      sheetApplicants.getRange(i + 1, 32).setValue('รอตรวจสอบ'); // status
      sheetApplicants.getRange(i + 1, 33).setValue('ผู้สมัครได้อัปโหลดเอกสารแก้ไขเพิ่มเติมแล้ว รอการตรวจสอบ'); // notes
      sheetApplicants.getRange(i + 1, 37).setValue(now); // updated_at
      break;
    }
  }

  // บันทึก Log
  sheetLogs.appendRow([
    'LOG-' + now.getTime(),
    appId,
    'เอกสารไม่ครบ',
    'รอตรวจสอบ',
    'ผู้สมัคร',
    'applicant',
    'อัปโหลดเอกสารแก้ไขเพิ่มเติม (' + docType + ')',
    now
  ]);

  return {
    success: true,
    fileUrl: driveFile.getUrl(),
    message: 'อัปโหลดเอกสารแก้ไขเรียบร้อยแล้ว'
  };
}
