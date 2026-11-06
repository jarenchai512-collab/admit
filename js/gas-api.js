/**
 * ระบบเชื่อมต่อ Google Apps Script Backend (API Client)
 * วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา 2570
 */

const GasApi = {
  // กุญแจ LocalStorage สำหรับเก็บ URL Backend
  STORAGE_KEY_URL: 'ttc_gas_webapp_url',
  STORAGE_KEY_APPLICANTS: 'ttc_applicants_db',
  STORAGE_KEY_LOGS: 'ttc_status_logs',
  STORAGE_KEY_SETTINGS: 'ttc_system_settings',
  STORAGE_KEY_STAFF: 'ttc_staff_session',

  /**
   * อ่าน URL ของ Google Apps Script Web App
   * @returns {string}
   */
  getBackendUrl() {
    return localStorage.getItem(this.STORAGE_KEY_URL) || '';
  },

  /**
   * บันทึก URL ของ Google Apps Script Web App
   * @param {string} url
   */
  setBackendUrl(url) {
    if (url) {
      localStorage.setItem(this.STORAGE_KEY_URL, url.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEY_URL);
    }
  },

  /**
   * ตรวจสอบว่ากำลังใช้โหมดเชื่อมต่อจริงหรือโหมดจำลอง (Mock LocalStorage)
   * @returns {boolean}
   */
  isLiveMode() {
    const url = this.getBackendUrl();
    return url && url.startsWith('https://script.google.com/');
  },

  /**
   * ส่ง Request ไปยัง Google Apps Script
   * @param {string} action
   * @param {object} payload
   * @returns {Promise<object>}
   */
  async request(action, payload = {}) {
    if (this.isLiveMode()) {
      try {
        const url = this.getBackendUrl();
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // GAS รับ text/plain เพื่อเลี่ยง preflight CORS
          body: JSON.stringify({ action, ...payload })
        });
        const data = await response.json();
        return data;
      } catch (err) {
        console.error('GAS Request Error:', err);
        return { success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + err.message };
      }
    } else {
      // ใช้งาน Local Mock Database เพื่อให้ทดสอบหน้าเว็บได้ทันที
      return this.mockHandler(action, payload);
    }
  },

  // ==========================================
  // ข้อมูลตั้งต้นสำหรับโหมดทดสอบ (Initial Seed)
  // ==========================================
  initMockData() {
    if (!localStorage.getItem(this.STORAGE_KEY_SETTINGS)) {
      const defaultSettings = {
        isOpen: true,
        academicYear: '2570',
        startDate: '2027-01-05',
        endDate: '2027-02-28',
        announcementTitle: 'ประกาศรับสมัครนักเรียน นักศึกษาใหม่ ประเภทโควตา ประจำปีการศึกษา ๒๕๗๐',
        announcementBody: 'วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ มีความประสงค์เปิดรับสมัครบุคคลเพื่อเข้าศึกษาต่อในระดับประกาศนียบัตรวิชาชีพ (ปวช.) และระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.) ประเภทโควตา ประจำปีการศึกษา ๒๕๗๐ ผู้สนใจสามารถยื่นใบสมัครออนไลน์ได้ตั้งแต่วันนี้ถึงวันที่ ๒๘ กุมภาพันธ์ ๒๕๗๐',
        quotaQualifications: 'สำเร็จการศึกษาหรือกำลังศึกษาอยู่ในระดับ ม.3, ปวช.3 หรือ ม.6 มีผลการเรียนเฉลี่ยสะสม (GPAX) ไม่ต่ำกว่า 2.00 มีความประพฤติเรียบร้อยและมีหนังสือรับรองจากสถานศึกษาเดิม',
        majorsVocational: [
          'เทคโนโลยีสารสนเทศ',
          'การบัญชี',
          'เทคโนโลยีธุรกิจดิจิทัล',
          'การตลาด',
          'ไฟฟ้ากำลัง',
          'อิเล็กทรอนิกส์',
          'เทคนิคคอมพิวเตอร์',
          'เทคนิคการผลิต',
          'ซ่อมบำรุงอุตสาหกรรม',
          'ยานยนต์',
          'เมคคาทรอนิกส์'
        ],
        majorsHighVocational: [
          'เทคโนโลยีสารสนเทศ',
          'การบัญชี',
          'เทคโนโลยีธุรกิจดิจิทัล',
          'การตลาด',
          'ไฟฟ้ากำลัง',
          'อิเล็กทรอนิกส์',
          'เทคโนโลยีคอมพิวเตอร์',
          'เทคนิคการผลิต',
          'ซ่อมบำรุงอุตสาหกรรม',
          'ยานยนต์',
          'เมคคาทรอนิกส์'
        ]
      };
      localStorage.setItem(this.STORAGE_KEY_SETTINGS, JSON.stringify(defaultSettings));
    }

    if (!localStorage.getItem(this.STORAGE_KEY_APPLICANTS)) {
      const mockApplicants = [
        {
          id: 'Q70-0001',
          academicYear: '2570',
          level: 'ปวช.',
          prefix: 'นาย',
          firstName: 'สมศักดิ์',
          lastName: 'รักการเรียน',
          fullName: 'นายสมศักดิ์ รักการเรียน',
          birthDate: '15/05/2555',
          idCard: '1100500123451',
          fatherName: 'นายประสิทธิ์ รักการเรียน',
          fatherAge: '48',
          fatherJob: 'พนักงานบริษัท',
          motherName: 'นางสุภาพร รักการเรียน',
          motherAge: '46',
          motherJob: 'ค้าขาย',
          houseNo: '45/2',
          moo: '3',
          soi: '-',
          road: 'พหลโยธิน',
          subdistrict: 'บ้านครัว',
          district: 'บ้านหมอ',
          province: 'สระบุรี',
          postalCode: '18270',
          phone: '0812345678',
          currentGrade: 'มัธยมศึกษาปีที่ 3',
          schoolName: 'โรงเรียนบ้านหมอ "พัฒนานุกูล"',
          schoolLocation: 'ตำบลบ้านหมอ อำเภอบ้านหมอ จังหวัดสระบุรี',
          gpax: '3.45',
          oldMajor: 'สามัญ',
          majorChoice1: 'เทคโนโลยีสารสนเทศ',
          majorChoice2: 'เทคนิคคอมพิวเตอร์',
          status: 'ผ่านการคัดเลือก',
          notes: 'เอกสารครบถ้วน ผลการเรียนอยู่ในเกณฑ์ดีเยี่ยม',
          studentId: '',
          enrolledDate: '',
          createdAt: '2026-11-01 09:30:00',
          documents: {
            photo: { name: 'photo_somsaak.jpg', url: 'assets/logo.png', uploadedAt: '2026-11-01 09:30:00' },
            transcript: { name: 'transcript_5terms.pdf', url: '#', uploadedAt: '2026-11-01 09:30:00' },
            idCopy: { name: 'id_card_copy.pdf', url: '#', uploadedAt: '2026-11-01 09:30:00' }
          }
        },
        {
          id: 'Q70-0002',
          academicYear: '2570',
          level: 'ปวส. (สายตรง)',
          prefix: 'นางสาว',
          firstName: 'กัญญาภัทร',
          lastName: 'วิริยะเจริญ',
          fullName: 'นางสาวกัญญาภัทร วิริยะเจริญ',
          birthDate: '22/08/2552',
          idCard: '1100500123460',
          fatherName: 'นายไพบูลย์ วิริยะเจริญ',
          fatherAge: '52',
          fatherJob: 'รับราชการ',
          motherName: 'นางรัตนา วิริยะเจริญ',
          motherAge: '50',
          motherJob: 'พยาบาลวิชาชีพ',
          houseNo: '118',
          moo: '5',
          soi: 'เทศบาล 4',
          road: 'อดิเรกสาร',
          subdistrict: 'ท่าหลวง',
          district: 'ท่าเรือ',
          province: 'พระนครศรีอยุธยา',
          postalCode: '13130',
          phone: '0898765432',
          currentGrade: 'ปวช.3',
          schoolName: 'วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์',
          schoolLocation: 'ตำบลบ้านครัว อำเภอบ้านหมอ จังหวัดสระบุรี',
          gpax: '3.82',
          oldMajor: 'การบัญชี',
          majorChoice1: 'การบัญชี',
          majorChoice2: '',
          status: 'มอบตัวแล้ว',
          notes: 'เอกสารสมบูรณ์ ชำระเงินลงทะเบียนเรียนเรียบร้อย',
          studentId: '70209010001',
          enrolledDate: '2026-11-04 14:15:00',
          createdAt: '2026-11-02 11:20:00',
          documents: {
            photo: { name: 'kanyapat_photo.png', url: 'assets/logo.png', uploadedAt: '2026-11-02 11:20:00' },
            transcript: { name: 'gpax_term5.pdf', url: '#', uploadedAt: '2026-11-02 11:20:00' },
            idCopy: { name: 'house_reg.pdf', url: '#', uploadedAt: '2026-11-02 11:20:00' }
          }
        },
        {
          id: 'Q70-0003',
          academicYear: '2570',
          level: 'ปวช.',
          prefix: 'นาย',
          firstName: 'ธนากร',
          lastName: 'มั่นคง',
          fullName: 'นายธนากร มั่นคง',
          birthDate: '10/01/2555',
          idCard: '1100500123478',
          fatherName: 'นายประเสริฐ มั่นคง',
          fatherAge: '45',
          fatherJob: 'ช่างยนต์',
          motherName: 'นางมณี มั่นคง',
          motherAge: '43',
          motherJob: 'แม่บ้าน',
          houseNo: '9/1',
          moo: '2',
          soi: '-',
          road: 'มิตรภาพ',
          subdistrict: 'ปากเพรียว',
          district: 'เมืองสระบุรี',
          province: 'สระบุรี',
          postalCode: '18000',
          phone: '0823456789',
          currentGrade: 'มัธยมศึกษาปีที่ 3',
          schoolName: 'โรงเรียนสระบุรีวิทยาคม',
          schoolLocation: 'ตำบลปากเพรียว อำเภอเมือง จังหวัดสระบุรี',
          gpax: '2.75',
          oldMajor: 'สามัญ',
          majorChoice1: 'ยานยนต์',
          majorChoice2: 'ไฟฟ้ากำลัง',
          status: 'เอกสารไม่ครบ',
          notes: 'เอกสารผลการเรียน (ปพ.1) ภาพถ่ายไม่ชัดเจน ขอให้ถ่ายใหม่และแนบเข้ามาใหม่',
          studentId: '',
          enrolledDate: '',
          createdAt: '2026-11-03 13:45:00',
          documents: {
            photo: { name: 'pic.jpg', url: 'assets/logo.png', uploadedAt: '2026-11-03 13:45:00' },
            transcript: { name: 'blurred_transcript.jpg', url: '#', uploadedAt: '2026-11-03 13:45:00' },
            idCopy: { name: 'id_card.pdf', url: '#', uploadedAt: '2026-11-03 13:45:00' }
          }
        },
        {
          id: 'Q70-0004',
          academicYear: '2570',
          level: 'ปวส. (ม.6/ปวช. ต่างสาขา)',
          prefix: 'นาย',
          firstName: 'วรวิทย์',
          lastName: 'แสงทอง',
          fullName: 'นายวรวิทย์ แสงทอง',
          birthDate: '04/11/2551',
          idCard: '1100500123486',
          fatherName: 'นายธีระ แสงทอง',
          fatherAge: '51',
          fatherJob: 'เกษตรกร',
          motherName: 'นางเพ็ญ แสงทอง',
          motherAge: '49',
          motherJob: 'เกษตรกร',
          houseNo: '77',
          moo: '6',
          soi: '-',
          road: '-',
          subdistrict: 'หนองโดน',
          district: 'หนองโดน',
          province: 'สระบุรี',
          postalCode: '18190',
          phone: '0834567890',
          currentGrade: 'มัธยมศึกษาปีที่ 6',
          schoolName: 'โรงเรียนสุวรรณวิทยา',
          schoolLocation: 'ตำบลดอนพุด อำเภอดอนพุด จังหวัดสระบุรี',
          gpax: '3.10',
          oldMajor: 'วิทย์-คณิต',
          majorChoice1: 'เมคคาทรอนิกส์',
          majorChoice2: '',
          status: 'รอตรวจสอบ',
          notes: 'รอเจ้าหน้าที่ฝ่ายรับสมัครตรวจสอบเอกสารตามลำดับ',
          studentId: '',
          enrolledDate: '',
          createdAt: '2026-11-05 10:10:00',
          documents: {
            photo: { name: 'worawit_photo.jpg', url: 'assets/logo.png', uploadedAt: '2026-11-05 10:10:00' },
            transcript: { name: 'gpax_worawit.pdf', url: '#', uploadedAt: '2026-11-05 10:10:00' },
            idCopy: { name: 'id_worawit.pdf', url: '#', uploadedAt: '2026-11-05 10:10:00' }
          }
        }
      ];
      localStorage.setItem(this.STORAGE_KEY_APPLICANTS, JSON.stringify(mockApplicants));
    }

    if (!localStorage.getItem(this.STORAGE_KEY_LOGS)) {
      const mockLogs = [
        {
          id: 'LOG-001',
          applicationId: 'Q70-0001',
          oldStatus: 'รอตรวจสอบ',
          newStatus: 'ผ่านการคัดเลือก',
          changedBy: 'เจ้าหน้าที่สมศรี งานทะเบียน',
          role: 'officer',
          notes: 'เอกสารครบถ้วน ผลการเรียนอยู่ในเกณฑ์ดีเยี่ยม',
          timestamp: '2026-11-02 14:00:00'
        },
        {
          id: 'LOG-002',
          applicationId: 'Q70-0002',
          oldStatus: 'ผ่านการคัดเลือก',
          newStatus: 'มอบตัวแล้ว',
          changedBy: 'นายทะเบียนอดุลย์',
          role: 'admin',
          notes: 'เอกสารสมบูรณ์ ชำระเงินลงทะเบียนเรียนเรียบร้อย',
          timestamp: '2026-11-04 14:15:00'
        },
        {
          id: 'LOG-003',
          applicationId: 'Q70-0003',
          oldStatus: 'รอตรวจสอบ',
          newStatus: 'เอกสารไม่ครบ',
          changedBy: 'เจ้าหน้าที่สมศรี งานทะเบียน',
          role: 'officer',
          notes: 'เอกสารผลการเรียน (ปพ.1) ภาพถ่ายไม่ชัดเจน ขอให้ถ่ายใหม่และแนบเข้ามาใหม่',
          timestamp: '2026-11-04 10:30:00'
        }
      ];
      localStorage.setItem(this.STORAGE_KEY_LOGS, JSON.stringify(mockLogs));
    }
  },

  /**
   * ตัวจัดการในเครื่อง (Local Storage Handler)
   */
  async mockHandler(action, payload) {
    this.initMockData();

    switch (action) {
      case 'getSettings': {
        const settings = JSON.parse(localStorage.getItem(this.STORAGE_KEY_SETTINGS) || '{}');
        return { success: true, data: settings };
      }

      case 'checkDuplicateID': {
        const applicants = JSON.parse(localStorage.getItem(this.STORAGE_KEY_APPLICANTS) || '[]');
        const cleanId = (payload.idCard || '').replace(/[-\s]/g, '');
        const exists = applicants.some(a => a.idCard.replace(/[-\s]/g, '') === cleanId && a.academicYear === (payload.academicYear || '2570'));
        return { success: true, exists };
      }

      case 'submitApplication': {
        const applicants = JSON.parse(localStorage.getItem(this.STORAGE_KEY_APPLICANTS) || '[]');
        const cleanId = (payload.idCard || '').replace(/[-\s]/g, '');

        // ตรวจสอบซ้ำอีกครั้ง
        const duplicate = applicants.find(a => a.idCard.replace(/[-\s]/g, '') === cleanId && a.academicYear === '2570');
        if (duplicate) {
          return { success: false, message: 'เลขประจำตัวประชาชนนี้ได้ทำการสมัครเรียนในปีการศึกษา 2570 แล้ว (เลขที่สมัคร: ' + duplicate.id + ')' };
        }

        // สร้างเลขที่ใบสมัคร Q70-XXXX
        const yearSuffix = '70';
        const nextNum = applicants.length + 1;
        const appId = `Q${yearSuffix}-${String(nextNum).padStart(4, '0')}`;

        const newApplicant = {
          ...payload,
          id: appId,
          academicYear: '2570',
          fullName: `${payload.prefix || ''}${payload.firstName} ${payload.lastName}`.trim(),
          status: 'รอตรวจสอบ',
          notes: 'ยื่นใบสมัครออนไลน์เรียบร้อย รอเจ้าหน้าที่ตรวจสอบเอกสาร',
          studentId: '',
          enrolledDate: '',
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        applicants.push(newApplicant);
        localStorage.setItem(this.STORAGE_KEY_APPLICANTS, JSON.stringify(applicants));

        // บันทึกลง Log
        const logs = JSON.parse(localStorage.getItem(this.STORAGE_KEY_LOGS) || '[]');
        logs.push({
          id: 'LOG-' + Date.now(),
          applicationId: appId,
          oldStatus: '-',
          newStatus: 'รอตรวจสอบ',
          changedBy: 'ระบบรับสมัครออนไลน์',
          role: 'system',
          notes: 'ผู้สมัครยื่นใบสมัครออนไลน์',
          timestamp: newApplicant.createdAt
        });
        localStorage.setItem(this.STORAGE_KEY_LOGS, JSON.stringify(logs));

        return {
          success: true,
          applicationId: appId,
          data: newApplicant,
          message: 'บันทึกข้อมูลการสมัครเรียบร้อยแล้ว'
        };
      }

      case 'checkStatus': {
        const applicants = JSON.parse(localStorage.getItem(this.STORAGE_KEY_APPLICANTS) || '[]');
        const cleanId = (payload.idCard || '').replace(/[-\s]/g, '');
        const found = applicants.find(a => a.idCard.replace(/[-\s]/g, '') === cleanId);

        if (!found) {
          return { success: false, message: 'ไม่พบข้อมูลการสมัครเรียนของเลขประจำตัวประชาชนนี้' };
        }

        // ส่งข้อมูลแบบปลอดภัย ไม่เปิดเผยข้อมูลส่วนตัวเกินจำเป็น
        const safeData = {
          id: found.id,
          fullName: found.fullName,
          level: found.level,
          majorChoice1: found.majorChoice1,
          majorChoice2: found.majorChoice2 || '-',
          status: found.status,
          notes: found.notes || '-',
          studentId: found.studentId || '',
          createdAt: found.createdAt,
          documents: found.documents || {}
        };

        return { success: true, data: safeData };
      }

      case 'reuploadDocument': {
        const applicants = JSON.parse(localStorage.getItem(this.STORAGE_KEY_APPLICANTS) || '[]');
        const idx = applicants.findIndex(a => a.id === payload.applicationId);
        if (idx === -1) {
          return { success: false, message: 'ไม่พบข้อมูลใบสมัคร' };
        }

        if (!applicants[idx].documents) applicants[idx].documents = {};
        applicants[idx].documents[payload.docType] = {
          name: payload.fileName,
          url: payload.fileData || '#',
          uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        applicants[idx].status = 'รอตรวจสอบ';
        applicants[idx].notes = 'ผู้สมัครได้อัปโหลดเอกสารแก้ไขเพิ่มเติมแล้ว รอการตรวจสอบ';

        localStorage.setItem(this.STORAGE_KEY_APPLICANTS, JSON.stringify(applicants));

        const logs = JSON.parse(localStorage.getItem(this.STORAGE_KEY_LOGS) || '[]');
        logs.push({
          id: 'LOG-' + Date.now(),
          applicationId: payload.applicationId,
          oldStatus: 'เอกสารไม่ครบ',
          newStatus: 'รอตรวจสอบ',
          changedBy: 'ผู้สมัคร',
          role: 'applicant',
          notes: `อัปโหลดเอกสารเพิ่มเติม (${payload.docType})`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
        localStorage.setItem(this.STORAGE_KEY_LOGS, JSON.stringify(logs));

        return { success: true, message: 'อัปโหลดเอกสารแก้ไขเรียบร้อยแล้ว' };
      }

      case 'staffLogin': {
        const { username, password } = payload;
        // บัญชีเจ้าหน้าที่มาตรฐาน
        const validUsers = [
          { username: 'admin', password: 'password123', fullName: 'นายอดุลย์ บริหารทะเบียน', role: 'admin', department: 'งานทะเบียนและประมวลผล' },
          { username: 'officer', password: 'password123', fullName: 'นางสมศรี งานทะเบียน', role: 'officer', department: 'งานรับสมัครนักเรียนนักศึกษา' }
        ];

        const user = validUsers.find(u => u.username === username && u.password === password);
        if (user) {
          const session = {
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            department: user.department,
            token: 'TOKEN-' + Date.now()
          };
          sessionStorage.setItem(this.STORAGE_KEY_STAFF, JSON.stringify(session));
          return { success: true, staff: session };
        } else {
          return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
        }
      }

      case 'getApplicants': {
        const applicants = JSON.parse(localStorage.getItem(this.STORAGE_KEY_APPLICANTS) || '[]');
        return { success: true, data: applicants };
      }

      case 'updateStatus': {
        const applicants = JSON.parse(localStorage.getItem(this.STORAGE_KEY_APPLICANTS) || '[]');
        const idx = applicants.findIndex(a => a.id === payload.applicationId);
        if (idx === -1) {
          return { success: false, message: 'ไม่พบใบสมัคร' };
        }

        const oldStatus = applicants[idx].status;
        applicants[idx].status = payload.newStatus;
        applicants[idx].notes = payload.notes || '';

        // กรณีมอบตัวแล้ว และยังไม่มีรหัสนักเรียน ให้ออกรหัสนักเรียนอัตโนมัติ
        if (payload.newStatus === 'มอบตัวแล้ว' && !applicants[idx].studentId) {
          const enrolledCount = applicants.filter(a => a.studentId).length + 1;
          applicants[idx].studentId = `7020901${String(enrolledCount).padStart(4, '0')}`;
          applicants[idx].enrolledDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
        }

        localStorage.setItem(this.STORAGE_KEY_APPLICANTS, JSON.stringify(applicants));

        const logs = JSON.parse(localStorage.getItem(this.STORAGE_KEY_LOGS) || '[]');
        logs.push({
          id: 'LOG-' + Date.now(),
          applicationId: payload.applicationId,
          oldStatus,
          newStatus: payload.newStatus,
          changedBy: payload.staffName || 'เจ้าหน้าที่',
          role: payload.staffRole || 'officer',
          notes: payload.notes || '',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
        localStorage.setItem(this.STORAGE_KEY_LOGS, JSON.stringify(logs));

        return { success: true, applicant: applicants[idx] };
      }

      case 'getStatusLogs': {
        const logs = JSON.parse(localStorage.getItem(this.STORAGE_KEY_LOGS) || '[]');
        const filtered = payload.applicationId ? logs.filter(l => l.applicationId === payload.applicationId) : logs;
        return { success: true, data: filtered };
      }

      case 'updateSettings': {
        const current = JSON.parse(localStorage.getItem(this.STORAGE_KEY_SETTINGS) || '{}');
        const updated = { ...current, ...payload.settings };
        localStorage.setItem(this.STORAGE_KEY_SETTINGS, JSON.stringify(updated));
        return { success: true, data: updated, message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' };
      }

      default:
        return { success: false, message: 'คำสั่งการทำงานไม่ถูกต้อง: ' + action };
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GasApi;
}
