/**
 * ระบบสร้างเอกสารใบสมัครทางการ ขนาด A4 (Official Application Form PDF Generator)
 * วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา 2570
 */

const PdfGenerator = {
  /**
   * สร้าง HTML ต้นแบบเอกสารใบสมัครตามรูปแบบราชการ ขนาด A4
   * @param {object} app ข้อมูลผู้สมัคร
   * @returns {string} HTML string
   */
  generateApplicationHTML(app) {
    const toThai = (n) => Validator.toThaiDigits(n);
    const photoUrl = (app.documents && app.documents.photo && app.documents.photo.url) ? app.documents.photo.url : 'assets/logo.png';

    return `
      <div class="a4-document-container">
        <div class="a4-page">
          <!-- ตราสัญลักษณ์และส่วนหัวทางการ -->
          <div class="doc-header">
            <div class="doc-header-left">
              <img src="assets/logo.png" alt="ตราสัญลักษณ์วิทยาลัย" class="doc-logo" />
            </div>
            <div class="doc-header-center">
              <div class="doc-title-main">ใบสมัครคัดเลือกเข้าศึกษาต่อ</div>
              <div class="doc-title-sub">ระดับประกาศนียบัตรวิชาชีพ (ปวช.) และระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)</div>
              <div class="doc-title-sub">ประเภทโควตา ประจำปีการศึกษา ๒๕๗๐</div>
              <div class="doc-title-inst">วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์</div>
              <div class="doc-title-dept">สังกัดสำนักงานคณะกรรมการการอาชีวศึกษา กระทรวงศึกษาธิการ</div>
            </div>
            <div class="doc-header-right">
              <div class="photo-box">
                <img src="${photoUrl}" alt="รูปถ่ายผู้สมัคร" class="photo-img" onerror="this.src='assets/logo.png'" />
                <div class="photo-label">รูปถ่ายขนาด ๑ นิ้ว</div>
              </div>
            </div>
          </div>

          <!-- เลขที่ใบสมัครและระดับที่สมัคร -->
          <div class="doc-meta-row">
            <div class="doc-meta-item">
              <span class="meta-label">เลขที่ใบสมัคร:</span>
              <span class="meta-value bold">${app.id} (เลขไทย: ${toThai(app.id)})</span>
            </div>
            <div class="doc-meta-item">
              <span class="meta-label">วันที่ยื่นใบสมัคร:</span>
              <span class="meta-value">${toThai(app.createdAt || '')}</span>
            </div>
            <div class="doc-meta-item">
              <span class="meta-label">ระดับที่สมัคร:</span>
              <span class="meta-value bold underline">${app.level}</span>
            </div>
          </div>

          <!-- ข้อ 1: ข้อมูลผู้สมัคร -->
          <div class="doc-section">
            <div class="doc-section-title">๑. ข้อมูลผู้สมัคร</div>
            <div class="doc-grid-row">
              <div class="col-7">
                <span class="lbl">ชื่อ - สกุล:</span> <span class="val bold">${app.fullName || (app.prefix + app.firstName + ' ' + app.lastName)}</span>
              </div>
              <div class="col-5">
                <span class="lbl">วัน/เดือน/ปีเกิด (พ.ศ.):</span> <span class="val">${app.birthDate || '-'}</span>
              </div>
            </div>
            <div class="doc-grid-row">
              <div class="col-12">
                <span class="lbl">เลขประจำตัวประชาชน (๑๓ หลัก):</span> 
                <span class="val mono bold">${Validator.formatThaiID(app.idCard)}</span>
                <span class="val-sub">(เลขไทย: ${toThai(Validator.formatThaiID(app.idCard))})</span>
              </div>
            </div>
          </div>

          <!-- ข้อ 2: ข้อมูลบิดา -->
          <div class="doc-section">
            <div class="doc-section-title">๒. ข้อมูลบิดา</div>
            <div class="doc-grid-row">
              <div class="col-6"><span class="lbl">ชื่อ - สกุล บิดา:</span> <span class="val">${app.fatherName || '-'}</span></div>
              <div class="col-2"><span class="lbl">อายุ:</span> <span class="val">${app.fatherAge ? app.fatherAge + ' ปี' : '-'}</span></div>
              <div class="col-4"><span class="lbl">อาชีพ:</span> <span class="val">${app.fatherJob || '-'}</span></div>
            </div>
          </div>

          <!-- ข้อ 3: ข้อมูลมารดา -->
          <div class="doc-section">
            <div class="doc-section-title">๓. ข้อมูลมารดา</div>
            <div class="doc-grid-row">
              <div class="col-6"><span class="lbl">ชื่อ - สกุล มารดา:</span> <span class="val">${app.motherName || '-'}</span></div>
              <div class="col-2"><span class="lbl">อายุ:</span> <span class="val">${app.motherAge ? app.motherAge + ' ปี' : '-'}</span></div>
              <div class="col-4"><span class="lbl">อาชีพ:</span> <span class="val">${app.motherJob || '-'}</span></div>
            </div>
          </div>

          <!-- ข้อ 4: ที่อยู่ปัจจุบันที่ติดต่อได้ -->
          <div class="doc-section">
            <div class="doc-section-title">๔. ที่อยู่ปัจจุบันที่ติดต่อได้</div>
            <div class="doc-grid-row">
              <div class="col-12">
                บ้านเลขที่ <span class="val">${app.houseNo || '-'}</span>
                หมู่ที่ <span class="val">${app.moo || '-'}</span>
                ซอย <span class="val">${app.soi || '-'}</span>
                ถนน <span class="val">${app.road || '-'}</span>
                ตำบล/แขวง <span class="val">${app.subdistrict || '-'}</span>
                อำเภอ/เขต <span class="val">${app.district || '-'}</span>
                จังหวัด <span class="val">${app.province || '-'}</span>
                รหัสไปรษณีย์ <span class="val">${app.postalCode || '-'}</span>
              </div>
            </div>
            <div class="doc-grid-row">
              <div class="col-12">
                <span class="lbl">หมายเลขโทรศัพท์ที่ติดต่อได้:</span> <span class="val bold">${Validator.formatPhone(app.phone)}</span>
              </div>
            </div>
          </div>

          <!-- ข้อ 5: ข้อมูลกำลังศึกษา -->
          <div class="doc-section">
            <div class="doc-section-title">๕. ข้อมูลการศึกษาเดิม / กำลังศึกษา</div>
            <div class="doc-grid-row">
              <div class="col-6"><span class="lbl">ระดับชั้น:</span> <span class="val">${app.currentGrade || '-'}</span></div>
              <div class="col-6"><span class="lbl">สถานศึกษา / โรงเรียน:</span> <span class="val bold">${app.schoolName || '-'}</span></div>
            </div>
            <div class="doc-grid-row">
              <div class="col-8"><span class="lbl">ที่ตั้งสถานศึกษา:</span> <span class="val">${app.schoolLocation || '-'}</span></div>
              <div class="col-4"><span class="lbl">ผลการเรียนเฉลี่ยสะสม (GPAX):</span> <span class="val bold">${app.gpax || '-'}</span></div>
            </div>
            <div class="doc-grid-row">
              <div class="col-12"><span class="lbl">สาขาวิชาเดิม (กรณี ปวช./ปวส.):</span> <span class="val">${app.oldMajor || '-'}</span></div>
            </div>
          </div>

          <!-- ข้อ 6: สาขาวิชาที่ต้องการสมัคร -->
          <div class="doc-section">
            <div class="doc-section-title">๖. สาขาวิชาที่ประสงค์สมัครเข้าศึกษาต่อ</div>
            <div class="doc-grid-row">
              <div class="col-12">
                <span class="lbl">อันดับที่ ๑:</span> <span class="val bold underline">${app.majorChoice1}</span>
                ${app.majorChoice2 ? `<span class="lbl" style="margin-left:24px;">อันดับที่ ๒:</span> <span class="val bold">${app.majorChoice2}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- รายการเอกสารหลักฐานประกอบการสมัคร -->
          <div class="doc-section doc-checklist">
            <div class="doc-section-title">รายการหลักฐานประกอบการสมัครที่แนบมา</div>
            <div class="checklist-grid">
              <div>[ / ] ๑. รูปถ่ายหน้าตรงขนาด ๑ นิ้ว (แนบในระบบแล้ว)</div>
              <div>[ / ] ๒. เอกสารแสดงผลการเรียนเฉลี่ยสะสม ๕ ภาคเรียน (ปพ.๑)</div>
              <div>[ / ] ๓. สำเนาบัตรประจำตัวประชาชน / สำเนาทะเบียนบ้าน</div>
              <div>[ ${app.documents && app.documents.cert ? '/' : ' '} ] ๔. สำเนาเกียรติบัตร / ใบรับรองความสามารถพิเศษ (ถ้ามี)</div>
            </div>
          </div>

          <!-- คำรับรองและส่วนลงชื่อ -->
          <div class="doc-footer-grid">
            <div class="sign-block">
              <div class="sign-statement">
                ข้าพเจ้าขอรับรองว่าข้อความและเอกสารหลักฐานดังกล่าวข้างต้นเป็นความจริงทุกประการ หากปรากฏว่าเป็นเท็จ ข้าพเจ้ายินยอมให้ตัดสิทธิ์การเข้าศึกษาต่อทันที
              </div>
              <div class="sign-line-box">
                <div class="sign-dots">ลงชื่อ..........................................................ผู้สมัคร</div>
                <div class="sign-name">( ${app.fullName || (app.prefix + app.firstName + ' ' + app.lastName)} )</div>
                <div class="sign-date">วันที่........เดือน....................พ.ศ. ๒๕๗๐</div>
              </div>
            </div>

            <div class="officer-block">
              <div class="officer-title">สำหรับเจ้าหน้าที่รับสมัครและตรวจสอบหลักฐาน</div>
              <div class="officer-checks">
                <div>[ ] หลักฐานครบถ้วน</div>
                <div>[ ] หลักฐานไม่ครบถ้วน (ขาด.......................................)</div>
                <div>[ ] ผ่านการตรวจสอบคุณสมบัติ</div>
              </div>
              <div class="sign-line-box" style="margin-top:14px;">
                <div class="sign-dots">ลงชื่อ..........................................................เจ้าหน้าที่</div>
                <div class="sign-name">(........................................................)</div>
                <div class="sign-date">วันที่......../................/๒๕๗๐</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  /**
   * เปิดหน้าต่างพิมพ์ / พรีวิวใบสมัครสำหรับสั่งพิมพ์เป็น PDF ขนาด A4
   * @param {object} app
   */
  openPrintPreview(app) {
    const html = this.generateApplicationHTML(app);
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) {
      alert('เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์ใบสมัคร');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>ใบสมัคร_${app.id}_${app.fullName || ''}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.45;
            color: #000;
            background: #f0f0f0;
            padding: 20px;
          }
          .toolbar {
            max-width: 210mm;
            margin: 0 auto 15px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #1F3A5F;
            color: #fff;
            padding: 10px 16px;
            border-radius: 4px;
          }
          .toolbar-btn {
            background: #ffffff;
            color: #1F3A5F;
            border: 1px solid #1F3A5F;
            padding: 6px 14px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            border-radius: 3px;
          }
          .toolbar-btn:hover {
            background: #e2e8f0;
          }
          .a4-document-container {
            display: flex;
            justify-content: center;
          }
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 18mm;
            background: #fff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            position: relative;
          }
          .doc-header {
            display: flex;
            align-items: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .doc-header-left { width: 80px; text-align: center; }
          .doc-logo { width: 75px; height: 75px; object-fit: contain; }
          .doc-header-center { flex: 1; text-align: center; padding: 0 10px; }
          .doc-title-main { font-size: 17px; font-weight: 700; }
          .doc-title-sub { font-size: 14px; font-weight: 600; }
          .doc-title-inst { font-size: 15px; font-weight: 700; margin-top: 2px; }
          .doc-title-dept { font-size: 12px; }
          .doc-header-right { width: 90px; text-align: right; }
          .photo-box {
            width: 85px;
            height: 105px;
            border: 1px solid #000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #fafafa;
            margin-left: auto;
          }
          .photo-img { width: 100%; height: 85px; object-fit: cover; }
          .photo-label { font-size: 9px; text-align: center; color: #555; margin-top: 2px; }
          .doc-meta-row {
            display: flex;
            justify-content: space-between;
            background: #f7f7f7;
            border: 1px solid #ccc;
            padding: 6px 10px;
            font-size: 13px;
            margin-bottom: 10px;
          }
          .doc-section {
            margin-bottom: 8px;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 6px;
          }
          .doc-section-title {
            font-weight: 700;
            font-size: 13.5px;
            color: #000;
            margin-bottom: 3px;
            background: #efefef;
            padding: 2px 6px;
          }
          .doc-grid-row {
            display: flex;
            flex-wrap: wrap;
            margin-bottom: 3px;
            font-size: 13px;
          }
          .col-12 { width: 100%; }
          .col-8 { width: 66.66%; }
          .col-7 { width: 58.33%; }
          .col-6 { width: 50%; }
          .col-5 { width: 41.66%; }
          .col-4 { width: 33.33%; }
          .col-2 { width: 16.66%; }
          .lbl { font-weight: 500; color: #222; }
          .val { border-bottom: 1px dotted #444; padding: 0 4px; display: inline-block; min-width: 40px; }
          .val.bold { font-weight: 600; }
          .val.mono { font-family: monospace; letter-spacing: 1px; }
          .val.underline { text-decoration: underline; }
          .val-sub { font-size: 11px; color: #555; margin-left: 4px; }
          .doc-checklist {
            background: #fdfdfd;
            border: 1px solid #ddd;
            padding: 6px 10px;
            margin-top: 6px;
            margin-bottom: 10px;
          }
          .checklist-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            font-size: 12px;
          }
          .doc-footer-grid {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 15px;
            margin-top: 10px;
            font-size: 12px;
          }
          .sign-block, .officer-block {
            border: 1px solid #bbb;
            padding: 8px 10px;
          }
          .sign-statement {
            font-size: 11px;
            line-height: 1.35;
            text-align: justify;
            margin-bottom: 12px;
          }
          .officer-title {
            font-weight: 700;
            border-bottom: 1px solid #ccc;
            padding-bottom: 3px;
            margin-bottom: 5px;
          }
          .officer-checks div { margin-bottom: 3px; font-size: 11.5px; }
          .sign-line-box { text-align: center; }
          .sign-dots { margin-bottom: 4px; font-size: 12px; }
          .sign-name { margin-bottom: 4px; font-size: 12px; }
          .sign-date { font-size: 11.5px; }

          @media print {
            body { background: #fff; padding: 0; }
            .toolbar { display: none !important; }
            .a4-page {
              width: 100%;
              min-height: auto;
              padding: 0;
              box-shadow: none;
            }
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <div><strong>วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์</strong> - พิมพ์ใบสมัครราชการ (A4)</div>
          <div>
            <button class="toolbar-btn" onclick="window.print()">สั่งพิมพ์เอกสาร / บันทึก PDF</button>
            <button class="toolbar-btn" onclick="window.close()" style="margin-left:8px;">ปิดหน้านี้</button>
          </div>
        </div>
        ${html}
      </body>
      </html>
    `);
    printWindow.document.close();
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PdfGenerator;
}
