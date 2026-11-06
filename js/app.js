/**
 * ตัวควบคุมหลักของแอปพลิเคชัน (Main Application Controller)
 * วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา 2570
 */

const App = {
  currentView: 'home',
  systemSettings: null,
  uploadedFiles: {
    photo: null,
    transcript: null,
    idCopy: null,
    cert: null
  },

  /**
   * เริ่มต้นแอปพลิเคชัน
   */
  async init() {
    this.setupNavigation();
    await this.loadSettings();
    this.renderHome();
    this.setupFormListeners();

    // เริ่มต้นระบบเจ้าหน้าที่
    if (window.AdminPortal) {
      window.AdminPortal.init();
    }
  },

  /**
   * โหลดการตั้งค่าระบบ
   */
  async loadSettings() {
    const res = await GasApi.request('getSettings');
    if (res.success) {
      this.systemSettings = res.data;
    }
  },

  /**
   * จัดการระบบนำทาง (Router)
   */
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        this.navigateTo(targetView);
      });
    });

    // ตรวจสอบ hash ตอนเริ่มต้น
    const hash = window.location.hash.replace('#', '');
    if (['home', 'apply', 'status', 'staff'].includes(hash)) {
      this.navigateTo(hash);
    }
  },

  /**
   * เปลี่ยนมุมมองหน้าจอ
   * @param {string} view
   */
  navigateTo(view) {
    this.currentView = view;
    window.location.hash = view;

    // ปรับปรุง active class ในเมนู
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-view') === view) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // ซ่อนทุก view แล้วแสดงเฉพาะ view ที่เลือก
    document.querySelectorAll('.view-container').forEach(el => {
      el.style.display = 'none';
    });

    const targetEl = document.getElementById(`view-${view}`);
    if (targetEl) {
      targetEl.style.display = 'block';
    }

    // เลื่อนหน้าจอขึ้นด้านบน
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // โหลดข้อมูลเฉพาะของแต่ละหน้า
    if (view === 'home') {
      this.renderHome();
    } else if (view === 'apply') {
      this.renderApplyForm();
    } else if (view === 'status') {
      this.renderStatusView();
    } else if (view === 'staff') {
      if (window.AdminPortal) window.AdminPortal.checkSession();
    }
  },

  // ==========================================
  // 1. หน้าแรก (Home)
  // ==========================================
  renderHome() {
    const s = this.systemSettings || {};
    const titleEl = document.getElementById('home-announcement-title');
    const bodyEl = document.getElementById('home-announcement-body');
    const qualEl = document.getElementById('home-quota-qual');
    const majorsVocEl = document.getElementById('home-majors-vocational');
    const majorsHighEl = document.getElementById('home-majors-high-vocational');

    if (titleEl) titleEl.textContent = s.announcementTitle || 'ประกาศรับสมัครนักเรียน นักศึกษาใหม่ ประเภทโควตา ประจำปีการศึกษา ๒๕๗๐';
    if (bodyEl) bodyEl.textContent = s.announcementBody || 'วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ มีความประสงค์เปิดรับสมัครบุคคลเพื่อเข้าศึกษาต่อในระดับประกาศนียบัตรวิชาชีพ (ปวช.) และระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)';
    if (qualEl) qualEl.textContent = s.quotaQualifications || 'สำเร็จการศึกษาหรือกำลังศึกษาอยู่ในระดับ ม.3, ปวช.3 หรือ ม.6 มีผลการเรียนเฉลี่ยสะสม (GPAX) ไม่ต่ำกว่า 2.00 มีความประพฤติเรียบร้อยและมีหนังสือรับรองจากสถานศึกษาเดิม';

    // รายชื่อสาขา ปวช.
    if (majorsVocEl && s.majorsVocational) {
      majorsVocEl.innerHTML = s.majorsVocational.map((m, i) => `<li>${i + 1}. สาขาวิชา${m}</li>`).join('');
    }

    // รายชื่อสาขา ปวส.
    if (majorsHighEl && s.majorsHighVocational) {
      majorsHighEl.innerHTML = s.majorsHighVocational.map((m, i) => `<li>${i + 1}. สาขาวิชา${m}</li>`).join('');
    }
  },

  // ==========================================
  // 2. แบบฟอร์มรับสมัคร (Application Form)
  // ==========================================
  renderApplyForm() {
    this.populateProvinces();
    this.updateMajorChoices();

    // ตรวจสอบว่าระบบเปิดรับสมัครหรือไม่
    const s = this.systemSettings || {};
    const alertClosed = document.getElementById('apply-closed-alert');
    const formBox = document.getElementById('main-apply-form');

    if (s.isOpen === false) {
      if (alertClosed) alertClosed.style.display = 'block';
      if (formBox) formBox.style.display = 'none';
    } else {
      if (alertClosed) alertClosed.style.display = 'none';
      if (formBox) formBox.style.display = 'block';
    }
  },

  /**
   * ใส่รายชื่อ 77 จังหวัดลงใน Dropdown
   */
  populateProvinces() {
    const provSelect = document.getElementById('app-province');
    if (!provSelect || provSelect.children.length > 1) return;

    THAI_PROVINCES.forEach(prov => {
      const opt = document.createElement('option');
      opt.value = prov;
      opt.textContent = prov;
      // ให้สระบุรีเป็นค่าเริ่มต้นที่แนะนำ
      if (prov === 'สระบุรี') {
        opt.selected = true;
      }
      provSelect.appendChild(opt);
    });
  },

  /**
   * ปรับปรุงรายการสาขาวิชาตามระดับการศึกษาที่เลือก
   */
  updateMajorChoices() {
    const levelSelect = document.querySelector('input[name="app-level"]:checked');
    const level = levelSelect ? levelSelect.value : 'ปวช.';
    const s = this.systemSettings || {};

    const major1Select = document.getElementById('app-major-1');
    const major2Select = document.getElementById('app-major-2');
    const major2Group = document.getElementById('group-major-2');

    const majors = level.startsWith('ปวช.') ? (s.majorsVocational || []) : (s.majorsHighVocational || []);

    if (major1Select) {
      major1Select.innerHTML = '<option value="">-- กรุณาเลือกสาขาวิชาที่ต้องการสมัคร --</option>';
      majors.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = `สาขาวิชา${m}`;
        major1Select.appendChild(opt);
      });
    }

    if (level === 'ปวช.') {
      // ปวช. เลือกได้ 2 ลำดับ
      if (major2Group) major2Group.style.display = 'block';
      if (major2Select) {
        major2Select.required = true;
        this.updateMajorChoice2Options();
      }
    } else {
      // ปวส. เลือก 1 สาขา
      if (major2Group) major2Group.style.display = 'none';
      if (major2Select) {
        major2Select.required = false;
        major2Select.value = '';
      }
    }
  },

  /**
   * ปรับปรุงตัวเลือกอันดับที่ 2 เพื่อห้ามซ้ำกับอันดับที่ 1
   */
  updateMajorChoice2Options() {
    const major1Select = document.getElementById('app-major-1');
    const major2Select = document.getElementById('app-major-2');
    if (!major1Select || !major2Select) return;

    const selected1 = major1Select.value;
    const s = this.systemSettings || {};
    const majors = s.majorsVocational || [];

    const current2 = major2Select.value;
    major2Select.innerHTML = '<option value="">-- กรุณาเลือกสาขาวิชาสำรองอันดับ ๒ --</option>';

    majors.forEach(m => {
      if (m !== selected1) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = `สาขาวิชา${m}`;
        if (m === current2) opt.selected = true;
        major2Select.appendChild(opt);
      }
    });
  },

  /**
   * ตั้งค่า Event Listeners สำหรับแบบฟอร์มและการตรวจสอบข้อมูล
   */
  setupFormListeners() {
    // เปลี่ยนระดับการศึกษา
    document.querySelectorAll('input[name="app-level"]').forEach(radio => {
      radio.addEventListener('change', () => this.updateMajorChoices());
    });

    // เปลี่ยนสาขาอันดับ 1
    const major1 = document.getElementById('app-major-1');
    if (major1) {
      major1.addEventListener('change', () => {
        const level = document.querySelector('input[name="app-level"]:checked')?.value;
        if (level === 'ปวช.') this.updateMajorChoice2Options();
      });
    }

    // จัดรูปแบบและตรวจเลขบัตรประชาชน
    const idInput = document.getElementById('app-id-card');
    if (idInput) {
      idInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 13);
        e.target.value = Validator.formatThaiID(val);

        const errorEl = document.getElementById('error-id-card');
        if (val.length === 13) {
          if (!Validator.validateThaiID(val)) {
            errorEl.textContent = 'เลขประจำตัวประชาชนไม่ถูกต้องตามหลักการคำนวณ (Checksum)';
            errorEl.style.display = 'block';
          } else {
            errorEl.style.display = 'none';
            // ตรวจการสมัครซ้ำ
            GasApi.request('checkDuplicateID', { idCard: val }).then(res => {
              if (res.exists) {
                errorEl.textContent = 'เลขประจำตัวประชาชนนี้ได้สมัครเรียนในปีการศึกษานี้แล้ว ไม่สามารถสมัครซ้ำได้';
                errorEl.style.display = 'block';
              }
            });
          }
        } else {
          errorEl.style.display = 'none';
        }
      });
    }

    // จัดรูปแบบหมายเลขโทรศัพท์
    const phoneInput = document.getElementById('app-phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 10);
        e.target.value = Validator.formatPhone(val);

        const errorEl = document.getElementById('error-phone');
        if (val.length === 10 && !Validator.validatePhone(val)) {
          errorEl.textContent = 'หมายเลขโทรศัพท์ต้องขึ้นต้นด้วย 0 และมี 10 หลัก';
          errorEl.style.display = 'block';
        } else {
          errorEl.style.display = 'none';
        }
      });
    }

    // ตรวจสอบ GPAX
    const gpaxInput = document.getElementById('app-gpax');
    if (gpaxInput) {
      gpaxInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const errorEl = document.getElementById('error-gpax');
        if (val !== '' && !Validator.validateGPAX(val)) {
          errorEl.textContent = 'ผลการเรียนเฉลี่ยสะสมต้องอยู่ระหว่าง 0.00 ถึง 4.00';
          errorEl.style.display = 'block';
        } else {
          errorEl.style.display = 'none';
        }
      });
    }

    // จัดการอัปโหลดไฟล์
    this.setupFileUploads();

    // บันทึกฟอร์มสมัคร
    const form = document.getElementById('main-apply-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleApplicationSubmit(e));
    }
  },

  /**
   * จัดการอัปโหลดไฟล์พร้อมพรีวิว
   */
  setupFileUploads() {
    const fileFields = ['photo', 'transcript', 'idCopy', 'cert'];

    fileFields.forEach(field => {
      const input = document.getElementById(`file-${field}`);
      const dropzone = document.getElementById(`dropzone-${field}`);
      const preview = document.getElementById(`preview-${field}`);
      const errEl = document.getElementById(`error-file-${field}`);

      if (!input || !dropzone) return;

      dropzone.addEventListener('click', () => input.click());

      // Drag and drop
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.add('drag-active');
        });
      });
      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.remove('drag-active');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          input.files = files;
          this.handleFileSelected(field, files[0]);
        }
      });

      input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFileSelected(field, e.target.files[0]);
        }
      });
    });
  },

  /**
   * ตรวจสอบและแสดงไฟล์ที่เลือก
   */
  handleFileSelected(field, file) {
    const preview = document.getElementById(`preview-${field}`);
    const errEl = document.getElementById(`error-file-${field}`);
    const dropzone = document.getElementById(`dropzone-${field}`);

    const check = Validator.validateFile(file);
    if (!check.valid) {
      if (errEl) {
        errEl.textContent = check.error;
        errEl.style.display = 'block';
      }
      this.uploadedFiles[field] = null;
      return;
    }

    if (errEl) errEl.style.display = 'none';

    // อ่านข้อมูลเพื่อเตรียมส่ง
    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedFiles[field] = {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type,
        data: e.target.result // Base64 Data URL
      };

      if (preview) {
        const isImage = file.type.startsWith('image/');
        preview.innerHTML = `
          <div class="file-preview-card">
            ${isImage ? `<img src="${e.target.result}" alt="Preview" class="preview-thumb" />` : '<div class="preview-pdf-icon">[PDF]</div>'}
            <div class="file-info-text">
              <span class="file-name">${file.name}</span>
              <span class="file-size">${this.uploadedFiles[field].size}</span>
            </div>
            <button type="button" class="btn btn-xs btn-outline" onclick="App.removeFile('${field}', event)">ยกเลิก</button>
          </div>
        `;
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  },

  /**
   * ยกเลิกไฟล์ที่เลือก
   */
  removeFile(field, e) {
    if (e) e.stopPropagation();
    this.uploadedFiles[field] = null;
    const input = document.getElementById(`file-${field}`);
    const preview = document.getElementById(`preview-${field}`);
    if (input) input.value = '';
    if (preview) {
      preview.innerHTML = '';
      preview.style.display = 'none';
    }
  },

  /**
   * ส่งแบบฟอร์มการสมัคร (Submit)
   */
  async handleApplicationSubmit(e) {
    e.preventDefault();

    // 1. ตรวจสอบเลขบัตรประชาชน
    const idCardRaw = document.getElementById('app-id-card').value.replace(/\D/g, '');
    if (!Validator.validateThaiID(idCardRaw)) {
      alert('กรุณาตรวจสอบเลขประจำตัวประชาชน 13 หลักให้ถูกต้อง');
      document.getElementById('app-id-card').focus();
      return;
    }

    // 2. ตรวจสอบหมายเลขโทรศัพท์
    const phoneRaw = document.getElementById('app-phone').value.replace(/\D/g, '');
    if (!Validator.validatePhone(phoneRaw)) {
      alert('กรุณากรอกหมายเลขโทรศัพท์ 10 หลักที่ถูกต้อง');
      document.getElementById('app-phone').focus();
      return;
    }

    // 3. ตรวจสอบ GPAX
    const gpaxVal = document.getElementById('app-gpax').value;
    if (!Validator.validateGPAX(gpaxVal)) {
      alert('กรุณาระบุผลการเรียนเฉลี่ยสะสม (GPAX) ระหว่าง 0.00 ถึง 4.00');
      document.getElementById('app-gpax').focus();
      return;
    }

    // 4. ตรวจสอบเอกสารบังคับ
    if (!this.uploadedFiles.photo) {
      alert('กรุณาแนบรูปถ่ายหน้าตรงขนาด 1 นิ้ว');
      return;
    }
    if (!this.uploadedFiles.transcript) {
      alert('กรุณาแนบเอกสารแสดงผลการเรียนเฉลี่ยสะสม 5 ภาคเรียน (ปพ.1)');
      return;
    }
    if (!this.uploadedFiles.idCopy) {
      alert('กรุณาแนบสำเนาบัตรประจำตัวประชาชนหรือสำเนาทะเบียนบ้าน');
      return;
    }

    // 5. ตรวจสอบยินยอม PDPA
    const pdpaConsent = document.getElementById('app-pdpa-consent');
    if (!pdpaConsent || !pdpaConsent.checked) {
      alert('กรุณาทำเครื่องหมายยินยอมการจัดเก็บข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-app');
    submitBtn.disabled = true;
    submitBtn.textContent = 'กำลังส่งข้อมูลการสมัคร...';

    // รวบรวมข้อมูล
    const payload = {
      level: document.querySelector('input[name="app-level"]:checked').value,
      prefix: document.getElementById('app-prefix').value,
      firstName: document.getElementById('app-firstname').value.trim(),
      lastName: document.getElementById('app-lastname').value.trim(),
      birthDate: document.getElementById('app-birthdate').value.trim(),
      idCard: idCardRaw,
      fatherName: document.getElementById('app-father-name').value.trim(),
      fatherAge: document.getElementById('app-father-age').value.trim(),
      fatherJob: document.getElementById('app-father-job').value.trim(),
      motherName: document.getElementById('app-mother-name').value.trim(),
      motherAge: document.getElementById('app-mother-age').value.trim(),
      motherJob: document.getElementById('app-mother-job').value.trim(),
      houseNo: document.getElementById('app-house-no').value.trim(),
      moo: document.getElementById('app-moo').value.trim(),
      soi: document.getElementById('app-soi').value.trim(),
      road: document.getElementById('app-road').value.trim(),
      subdistrict: document.getElementById('app-subdistrict').value.trim(),
      district: document.getElementById('app-district').value.trim(),
      province: document.getElementById('app-province').value,
      postalCode: document.getElementById('app-postal-code').value.trim(),
      phone: phoneRaw,
      currentGrade: document.getElementById('app-grade').value.trim(),
      schoolName: document.getElementById('app-school-name').value.trim(),
      schoolLocation: document.getElementById('app-school-loc').value.trim(),
      gpax: gpaxVal,
      oldMajor: document.getElementById('app-old-major').value.trim(),
      majorChoice1: document.getElementById('app-major-1').value,
      majorChoice2: document.getElementById('app-major-2') ? document.getElementById('app-major-2').value : '',
      documents: {
        photo: { name: this.uploadedFiles.photo.name, url: this.uploadedFiles.photo.data, uploadedAt: new Date().toISOString() },
        transcript: { name: this.uploadedFiles.transcript.name, url: this.uploadedFiles.transcript.data, uploadedAt: new Date().toISOString() },
        idCopy: { name: this.uploadedFiles.idCopy.name, url: this.uploadedFiles.idCopy.data, uploadedAt: new Date().toISOString() },
        cert: this.uploadedFiles.cert ? { name: this.uploadedFiles.cert.name, url: this.uploadedFiles.cert.data, uploadedAt: new Date().toISOString() } : null
      }
    };

    const res = await GasApi.request('submitApplication', payload);
    submitBtn.disabled = false;
    submitBtn.textContent = 'ส่งใบสมัครเรียนออนไลน์';

    if (res.success) {
      this.showSubmitSuccess(res.data);
    } else {
      alert('ไม่สามารถส่งใบสมัครได้: ' + res.message);
    }
  },

  /**
   * แสดงหน้าต่างเมื่อส่งใบสมัครสำเร็จ
   */
  showSubmitSuccess(applicant) {
    const container = document.getElementById('apply-success-box');
    const formBox = document.getElementById('main-apply-form');

    if (formBox) formBox.style.display = 'none';

    container.innerHTML = `
      <div class="card success-card">
        <div class="card-header-navy">
          การส่งใบสมัครเรียนออนไลน์สำเร็จ
        </div>
        <div class="card-body">
          <div class="success-banner">
            <div class="success-app-id">เลขที่ใบสมัคร: <strong>${applicant.id}</strong></div>
            <div class="success-name">ผู้สมัคร: <strong>${applicant.fullName}</strong></div>
            <div class="success-meta">ระดับ: ${applicant.level} | สาขาวิชา: ${applicant.majorChoice1}</div>
          </div>

          <div class="notice-box" style="margin-top:20px;">
            <strong>คำแนะนำสำคัญสำหรับผู้สมัคร:</strong>
            <p>1. กรุณาพิมพ์หรือบันทึกเอกสารใบสมัครทางการ (ขนาด A4) เก็บไว้เป็นหลักฐาน</p>
            <p>2. สามารถตรวจสอบสถานะการพิจารณาและผลการคัดเลือกได้ที่เมนู "ตรวจสอบสถานะ" โดยใช้เลขประจำตัวประชาชน 13 หลัก</p>
            <p>3. เจ้าหน้าที่จะดำเนินการตรวจสอบเอกสารหลักฐาน หากเอกสารไม่สมบูรณ์จะแจ้งให้แก้ไขผ่านระบบตรวจสอบสถานะ</p>
          </div>

          <div class="success-actions" style="margin-top:25px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="PdfGenerator.openPrintPreview(App.lastSubmittedApplicant)">
              พิมพ์ / บันทึกใบสมัคร (PDF ขนาด A4)
            </button>
            <button class="btn btn-secondary" onclick="App.goToStatusWithID('${applicant.idCard}')">
              ไปที่หน้าตรวจสอบสถานะ
            </button>
            <button class="btn btn-outline" onclick="App.resetApplyForm()">
              กลับสู่หน้าหลัก
            </button>
          </div>
        </div>
      </div>
    `;

    this.lastSubmittedApplicant = applicant;
    container.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * ล้างแบบฟอร์มเพื่อเริ่มใหม่
   */
  resetApplyForm() {
    const form = document.getElementById('main-apply-form');
    if (form) form.reset();
    ['photo', 'transcript', 'idCopy', 'cert'].forEach(f => this.removeFile(f));
    const container = document.getElementById('apply-success-box');
    if (container) container.style.display = 'none';
    this.navigateTo('home');
  },

  /**
   * ลิงก์ตรงไปหน้าตรวจสอบสถานะพร้อมใส่เลขบัตรประชาชน
   */
  goToStatusWithID(idCard) {
    this.navigateTo('status');
    const input = document.getElementById('status-search-id');
    if (input) {
      input.value = Validator.formatThaiID(idCard);
      this.handleStatusLookup();
    }
  },

  // ==========================================
  // 3. ตรวจสอบสถานะ (Status Lookup)
  // ==========================================
  renderStatusView() {
    // รีเซ็ตการแสดงผล
    const resultBox = document.getElementById('status-result-box');
    if (resultBox && !document.getElementById('status-search-id').value) {
      resultBox.style.display = 'none';
    }
  },

  /**
   * ค้นหาสถานะผู้สมัคร
   */
  async handleStatusLookup(e) {
    if (e) e.preventDefault();
    const rawId = document.getElementById('status-search-id').value.replace(/\D/g, '');
    const resultBox = document.getElementById('status-result-box');

    if (!rawId || rawId.length !== 13) {
      alert('กรุณากรอกเลขประจำตัวประชาชน 13 หลักให้ครบถ้วน');
      return;
    }

    resultBox.innerHTML = '<div class="loading-spinner">กำลังตรวจสอบข้อมูล...</div>';
    resultBox.style.display = 'block';

    const res = await GasApi.request('checkStatus', { idCard: rawId });

    if (!res.success) {
      resultBox.innerHTML = `
        <div class="alert-box alert-error">
          ${res.message || 'ไม่พบข้อมูลการสมัครเรียนของเลขประจำตัวประชาชนนี้'}
        </div>
      `;
      return;
    }

    const app = res.data;
    const badgeClass = AdminPortal.getStatusBadgeClass(app.status);
    const isIncomplete = app.status === 'เอกสารไม่ครบ';

    resultBox.innerHTML = `
      <div class="card status-card">
        <div class="card-header-navy">
          ผลการตรวจสอบสถานะการสมัครเรียน
        </div>
        <div class="card-body">
          <div class="status-summary-grid">
            <div class="status-item">
              <span class="status-lbl">เลขที่ใบสมัคร:</span>
              <span class="status-val bold mono-code">${app.id}</span>
            </div>
            <div class="status-item">
              <span class="status-lbl">ชื่อ - สกุล ผู้สมัคร:</span>
              <span class="status-val bold">${app.fullName}</span>
            </div>
            <div class="status-item">
              <span class="status-lbl">ระดับการศึกษา:</span>
              <span class="status-val">${app.level}</span>
            </div>
            <div class="status-item">
              <span class="status-lbl">สาขาวิชาที่เลือก:</span>
              <span class="status-val">๑. ${app.majorChoice1} ${app.majorChoice2 !== '-' ? `(๒. ${app.majorChoice2})` : ''}</span>
            </div>
            <div class="status-item">
              <span class="status-lbl">สถานะปัจจุบัน:</span>
              <span class="status-val"><span class="badge ${badgeClass}" style="font-size:14px;">${app.status}</span></span>
            </div>
            ${app.studentId ? `
              <div class="status-item">
                <span class="status-lbl">รหัสประจำตัวนักเรียน:</span>
                <span class="status-val bold mono-code" style="color:#1F3A5F; font-size:16px;">${app.studentId}</span>
              </div>
            ` : ''}
          </div>

          <div class="status-notes-box">
            <div class="notes-header">ข้อความแจ้งเตือน / หมายเหตุจากเจ้าหน้าที่:</div>
            <div class="notes-body">${app.notes}</div>
          </div>

          <!-- หากเอกสารไม่ครบ ให้แสดงกล่องอัปโหลดเอกสารแก้ไข -->
          ${isIncomplete ? `
            <div class="reupload-box">
              <div class="reupload-title">ส่วนอัปโหลดเอกสารแก้ไขเพิ่มเติม</div>
              <p style="font-size:13px; color:#555;">กรณีเจ้าหน้าที่แจ้งว่าเอกสารไม่สมบูรณ์ ท่านสามารถเลือกประเภทเอกสารและอัปโหลดไฟล์ใหม่ได้ที่นี่:</p>
              
              <form id="reupload-form" onsubmit="App.handleReupload(event, '${app.id}')" style="margin-top:10px;">
                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">ประเภทเอกสารที่ต้องการส่งใหม่:</label>
                    <select id="reupload-doc-type" class="form-select" required>
                      <option value="transcript">เอกสารแสดงผลการเรียน ๕ ภาคเรียน (ปพ.๑)</option>
                      <option value="photo">รูปถ่ายหน้าตรงขนาด ๑ นิ้ว</option>
                      <option value="idCopy">สำเนาบัตรประชาชน / สำเนาทะเบียนบ้าน</option>
                      <option value="cert">เกียรติบัตร / ใบรับรองความสามารถพิเศษ</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">เลือกไฟล์ใหม่ (JPG, PNG, PDF ไม่เกิน 5MB):</label>
                    <input type="file" id="reupload-file-input" class="form-input" accept=".jpg,.jpeg,.png,.pdf" required />
                  </div>
                </div>
                <button type="submit" class="btn btn-primary btn-sm" style="margin-top:5px;">อัปโหลดเอกสารแก้ไข</button>
              </form>
            </div>
          ` : ''}

          <div style="margin-top:20px; text-align:center;">
            <button class="btn btn-secondary btn-sm" onclick="App.reprintApplication('${app.id}')">
              พิมพ์ / บันทึกใบสมัคร (PDF ขนาด A4)
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * ส่งไฟล์แก้ไขเพิ่มเติม
   */
  async handleReupload(e, appId) {
    e.preventDefault();
    const docType = document.getElementById('reupload-doc-type').value;
    const fileInput = document.getElementById('reupload-file-input');

    if (!fileInput.files || fileInput.files.length === 0) {
      alert('กรุณาเลือกไฟล์ที่ต้องการส่ง');
      return;
    }

    const file = fileInput.files[0];
    const check = Validator.validateFile(file);
    if (!check.valid) {
      alert(check.error);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const res = await GasApi.request('reuploadDocument', {
        applicationId: appId,
        docType,
        fileName: file.name,
        fileData: event.target.result
      });

      if (res.success) {
        alert('อัปโหลดเอกสารแก้ไขเรียบร้อยแล้ว สถานะถูกปรับเป็น "รอตรวจสอบ"');
        App.handleStatusLookup();
      } else {
        alert('เกิดข้อผิดพลาด: ' + res.message);
      }
    };
    reader.readAsDataURL(file);
  },

  /**
   * พิมพ์ใบสมัครจากหน้ารายละเอียดสถานะ
   */
  async reprintApplication(appId) {
    const res = await GasApi.request('getApplicants');
    if (res.success) {
      const found = res.data.find(a => a.id === appId);
      if (found) {
        PdfGenerator.openPrintPreview(found);
      } else {
        alert('ไม่พบข้อมูลเอกสาร');
      }
    }
  }
};

// เริ่มต้นทำงานเมื่อ DOM โหลดเสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
