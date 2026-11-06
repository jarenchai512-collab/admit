/**
 * ระบบรับสมัครเรียนออนไลน์ (โควตา) วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา ๒๕๗๐
 * ไฟล์: PdfService.gs - บริการสร้างไฟล์ใบสมัคร PDF บน Google Drive ฝั่งเซิร์ฟเวอร์
 */

/**
 * แปลงเลขอารบิกเป็นเลขไทย
 */
function toThaiNumerals(input) {
  if (input === null || input === undefined) return '';
  var thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return input.toString().replace(/[0-9]/g, function(d) {
    return thaiDigits[parseInt(d, 10)];
  });
}

/**
 * สร้างไฟล์ PDF ใบสมัครราชการ ขนาด A4 และบันทึกลงใน Google Drive
 * @param {string} applicationId
 * @returns {object}
 */
function generateServerApplicationPdf(applicationId) {
  var ss = getDb();
  var sheet = ss.getSheetByName('Applicants');
  var data = sheet.getDataRange().getValues();
  var app = null;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === applicationId) {
      app = {
        id: data[i][0],
        academicYear: data[i][1],
        level: data[i][2],
        prefix: data[i][3],
        firstName: data[i][4],
        lastName: data[i][5],
        fullName: data[i][6],
        birthDate: data[i][7],
        idCard: data[i][8],
        fatherName: data[i][9],
        fatherAge: data[i][10],
        fatherJob: data[i][11],
        motherName: data[i][12],
        motherAge: data[i][13],
        motherJob: data[i][14],
        houseNo: data[i][15],
        moo: data[i][16],
        soi: data[i][17],
        road: data[i][18],
        subdistrict: data[i][19],
        district: data[i][20],
        province: data[i][21],
        postalCode: data[i][22],
        phone: data[i][23],
        currentGrade: data[i][24],
        schoolName: data[i][25],
        schoolLocation: data[i][26],
        gpax: data[i][27],
        oldMajor: data[i][28],
        majorChoice1: data[i][29],
        majorChoice2: data[i][30],
        status: data[i][31],
        createdAt: Utilities.formatDate(new Date(data[i][35]), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss')
      };
      break;
    }
  }

  if (!app) {
    return { success: false, message: 'ไม่พบข้อมูลใบสมัคร' };
  }

  // สร้างเอกสาร HTML ขนาด A4
  var htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Sarabun', sans-serif; font-size: 13px; line-height: 1.4; color: #000; padding: 15mm; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
        .title-1 { font-size: 16px; font-weight: bold; }
        .title-2 { font-size: 14px; font-weight: bold; }
        .title-3 { font-size: 15px; font-weight: bold; margin-top: 2px; }
        .meta-box { background: #f5f5f5; border: 1px solid #ccc; padding: 6px; margin-bottom: 10px; font-size: 12px; }
        .section-title { font-weight: bold; background: #e5e5e5; padding: 3px 6px; margin-top: 8px; margin-bottom: 4px; }
        .row { margin-bottom: 3px; }
        .underline-val { border-bottom: 1px dotted #000; padding: 0 4px; font-weight: bold; }
        .footer-grid { margin-top: 15px; display: table; width: 100%; font-size: 11.5px; }
        .col-sign { display: table-cell; width: 55%; vertical-align: top; border: 1px solid #aaa; padding: 8px; }
        .col-officer { display: table-cell; width: 45%; vertical-align: top; border: 1px solid #aaa; padding: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title-1">ใบสมัครคัดเลือกเข้าศึกษาต่อ</div>
        <div class="title-2">ระดับประกาศนียบัตรวิชาชีพ (ปวช.) และระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)</div>
        <div class="title-2">ประเภทโควตา ประจำปีการศึกษา ๒๕๗๐</div>
        <div class="title-3">วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์</div>
        <div>สังกัดสำนักงานคณะกรรมการการอาชีวศึกษา กระทรวงศึกษาธิการ</div>
      </div>

      <div class="meta-box">
        เลขที่ใบสมัคร: <strong>${app.id} (เลขไทย: ${toThaiNumerals(app.id)})</strong> | ระดับ: <strong>${app.level}</strong> | วันที่ยื่น: ${toThaiNumerals(app.createdAt)}
      </div>

      <div class="section-title">๑. ข้อมูลผู้สมัคร</div>
      <div class="row">ชื่อ - สกุล: <span class="underline-val">${app.fullName}</span> วันเกิด: <span class="underline-val">${app.birthDate}</span></div>
      <div class="row">เลขประจำตัวประชาชน (๑๓ หลัก): <span class="underline-val">${app.idCard}</span> (เลขไทย: ${toThaiNumerals(app.idCard)})</div>

      <div class="section-title">๒. ข้อมูลบิดา</div>
      <div class="row">ชื่อ - สกุล บิดา: <span class="underline-val">${app.fatherName}</span> อายุ: ${app.fatherAge} ปี อาชีพ: ${app.fatherJob}</div>

      <div class="section-title">๓. ข้อมูลมารดา</div>
      <div class="row">ชื่อ - สกุล มารดา: <span class="underline-val">${app.motherName}</span> อายุ: ${app.motherAge} ปี อาชีพ: ${app.motherJob}</div>

      <div class="section-title">๔. ที่อยู่ปัจจุบันที่ติดต่อได้</div>
      <div class="row">บ้านเลขที่ ${app.houseNo} ม.${app.moo} ซอย ${app.soi} ถนน ${app.road} ต.${app.subdistrict} อ.${app.district} จ.${app.province} ${app.postalCode}</div>
      <div class="row">หมายเลขโทรศัพท์: <span class="underline-val">${app.phone}</span></div>

      <div class="section-title">๕. ข้อมูลการศึกษาเดิม / กำลังศึกษา</div>
      <div class="row">ระดับชั้น: ${app.currentGrade} สถานศึกษาเดิม: <span class="underline-val">${app.schoolName}</span> (${app.schoolLocation})</div>
      <div class="row">ผลการเรียนเฉลี่ยสะสม (GPAX): <span class="underline-val">${app.gpax}</span> สาขาวิชาเดิม: ${app.oldMajor || '-'}</div>

      <div class="section-title">๖. สาขาวิชาที่ต้องการสมัคร</div>
      <div class="row">อันดับที่ ๑: <span class="underline-val">${app.majorChoice1}</span> ${app.majorChoice2 ? ' อันดับที่ ๒: <span class="underline-val">' + app.majorChoice2 + '</span>' : ''}</div>

      <div class="footer-grid">
        <div class="col-sign">
          <div>ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริงทุกประการ</div>
          <br><br>
          <div style="text-align:center;">ลงชื่อ..........................................................ผู้สมัคร<br>(${app.fullName})<br>วันที่......../......../๒๕๗๐</div>
        </div>
        <div class="col-officer">
          <strong>สำหรับเจ้าหน้าที่รับสมัคร</strong>
          <div>[ ] หลักฐานครบถ้วน</div>
          <div>[ ] ผ่านการตรวจสอบคุณสมบัติ</div>
          <br>
          <div style="text-align:center;">ลงชื่อ..........................................................เจ้าหน้าที่<br>(........................................................)<br>วันที่......../......../๒๕๗๐</div>
        </div>
      </div>
    </body>
    </html>
  `;

  // แปลง HTML เป็น PDF Blob
  var blob = Utilities.newBlob(htmlContent, 'text/html', app.id + '.html').getAs('application/pdf');
  blob.setName('ใบสมัคร_' + app.id + '_' + app.fullName + '.pdf');

  var folder = getStorageFolder();
  var subFolders = folder.getFoldersByName(app.id);
  var targetSubFolder = subFolders.hasNext() ? subFolders.next() : folder;

  var pdfFile = targetSubFolder.createFile(blob);

  return {
    success: true,
    fileId: pdfFile.getId(),
    fileUrl: pdfFile.getUrl(),
    message: 'สร้างเอกสาร PDF บน Google Drive สำเร็จ'
  };
}
