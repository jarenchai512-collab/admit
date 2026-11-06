/**
 * ระบบจัดการสำหรับเจ้าหน้าที่และผู้ดูแลระบบ (Staff & Administration Module)
 * วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา 2570
 */

const AdminPortal = {
  currentStaff: null,
  applicantsData: [],
  filteredData: [],
  currentApplicant: null,
  activeTab: 'applicants', // 'applicants', 'dashboard', 'settings'

  /**
   * เริ่มต้นระบบเจ้าหน้าที่
   */
  init() {
    this.checkSession();
  },

  /**
   * ตรวจสอบ Session ที่ล็อกอินค้างไว้
   */
  checkSession() {
    const sessionStr = sessionStorage.getItem(GasApi.STORAGE_KEY_STAFF);
    if (sessionStr) {
      try {
        this.currentStaff = JSON.parse(sessionStr);
        this.renderStaffPortal();
      } catch (e) {
        this.renderLoginForm();
      }
    } else {
      this.renderLoginForm();
    }
  },

  /**
   * แสดงแบบฟอร์มล็อกอิน
   */
  renderLoginForm() {
    const container = document.getElementById('staff-portal-content');
    if (!container) return;

    container.innerHTML = `
      <div class="login-wrapper">
        <div class="card login-card">
          <div class="card-header-navy">
            เข้าสู่ระบบสำหรับเจ้าหน้าที่และผู้ดูแลระบบ
          </div>
          <div class="card-body">
            <p class="login-desc">กรุณาระบุชื่อผู้ใช้และรหัสผ่านเพื่อเข้าใช้งานระบบงานทะเบียนและรับสมัคร</p>
            <div id="login-error-msg" class="alert-box alert-error" style="display:none;"></div>
            
            <form id="staff-login-form" onsubmit="AdminPortal.handleLogin(event)">
              <div class="form-group">
                <label for="staff-username" class="form-label">ชื่อผู้ใช้งาน (Username)</label>
                <input type="text" id="staff-username" class="form-input" required autofocus placeholder="เช่น admin หรือ officer" />
              </div>
              <div class="form-group">
                <label for="staff-password" class="form-label">รหัสผ่าน (Password)</label>
                <input type="password" id="staff-password" class="form-input" required placeholder="ระบุรหัสผ่าน" />
              </div>
              <div class="form-actions" style="margin-top:20px;">
                <button type="submit" class="btn btn-primary" style="width:100%;">เข้าสู่ระบบ</button>
              </div>
            </form>

            <div class="login-hint-box">
              <div class="hint-title">บัญชีทดสอบสำหรับประเมินระบบ:</div>
              <div>• <strong>ผู้ดูแลระบบ (Admin):</strong> บัญชี: <code>admin</code> / รหัสผ่าน: <code>password123</code></div>
              <div>• <strong>เจ้าหน้าที่ทะเบียน (Officer):</strong> บัญชี: <code>officer</code> / รหัสผ่าน: <code>password123</code></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * ประมวลผลการเข้าสู่ระบบ
   */
  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('staff-username').value.trim();
    const password = document.getElementById('staff-password').value;
    const errorBox = document.getElementById('login-error-msg');

    errorBox.style.display = 'none';

    const res = await GasApi.request('staffLogin', { username, password });
    if (res.success) {
      this.currentStaff = res.staff;
      this.renderStaffPortal();
    } else {
      errorBox.textContent = res.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      errorBox.style.display = 'block';
    }
  },

  /**
   * ออกจากระบบ
   */
  logout() {
    sessionStorage.removeItem(GasApi.STORAGE_KEY_STAFF);
    this.currentStaff = null;
    this.renderLoginForm();
  },

  /**
   * แสดงหน้าต่างหลักของเจ้าหน้าที่
   */
  async renderStaffPortal() {
    const container = document.getElementById('staff-portal-content');
    if (!container) return;

    const isAdmin = this.currentStaff.role === 'admin';
    const roleText = isAdmin ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่ทะเบียน';

    container.innerHTML = `
      <div class="staff-header-bar">
        <div class="staff-user-info">
          ผู้ใช้งาน: <strong>${this.currentStaff.fullName}</strong> (${roleText}) | หน่วยงาน: ${this.currentStaff.department}
        </div>
        <div class="staff-header-actions">
          <button class="btn btn-secondary btn-sm" onclick="AdminPortal.logout()">ออกจากระบบ</button>
        </div>
      </div>

      <!-- แถบเมนูย่อยของเจ้าหน้าที่ -->
      <div class="staff-subnav">
        <button class="subnav-btn ${this.activeTab === 'applicants' ? 'active' : ''}" onclick="AdminPortal.switchTab('applicants')">
          ทะเบียนรายชื่อผู้สมัคร
        </button>
        <button class="subnav-btn ${this.activeTab === 'dashboard' ? 'active' : ''}" onclick="AdminPortal.switchTab('dashboard')">
          สถิติและรายงานสรุป
        </button>
        ${isAdmin ? `
          <button class="subnav-btn ${this.activeTab === 'settings' ? 'active' : ''}" onclick="AdminPortal.switchTab('settings')">
            ตั้งค่าระบบรับสมัคร
          </button>
        ` : ''}
      </div>

      <div id="staff-tab-content" style="margin-top:15px;">
        <!-- เนื้อหาแต่ละแท็บจะโหลดที่นี่ -->
      </div>
    `;

    this.loadTabContent();
  },

  /**
   * สลับแท็บ
   */
  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.subnav-btn').forEach(btn => btn.classList.remove('active'));
    this.renderStaffPortal();
  },

  /**
   * โหลดเนื้อหาตามแท็บที่เลือก
   */
  async loadTabContent() {
    const tabContainer = document.getElementById('staff-tab-content');
    if (!tabContainer) return;

    if (this.activeTab === 'applicants') {
      await this.loadApplicantsTab(tabContainer);
    } else if (this.activeTab === 'dashboard') {
      await this.loadDashboardTab(tabContainer);
    } else if (this.activeTab === 'settings') {
      await this.loadSettingsTab(tabContainer);
    }
  },

  // ==========================================
  // แท็บที่ 1: ทะเบียนรายชื่อผู้สมัคร
  // ==========================================
  async loadApplicantsTab(container) {
    container.innerHTML = '<div class="loading-spinner">กำลังโหลดข้อมูลผู้สมัคร...</div>';

    const res = await GasApi.request('getApplicants');
    if (!res.success) {
      container.innerHTML = `<div class="alert-box alert-error">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${res.message}</div>`;
      return;
    }

    this.applicantsData = res.data || [];
    this.filteredData = [...this.applicantsData];

    container.innerHTML = `
      <div class="table-control-panel">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">ค้นหา:</label>
            <input type="text" id="filter-search" class="form-input form-input-sm" placeholder="เลขที่สมัคร, ชื่อ-สกุล, เลขบัตร, ร.ร.เดิม" oninput="AdminPortal.applyFilters()" />
          </div>
          <div class="filter-group">
            <label class="filter-label">ระดับชั้น:</label>
            <select id="filter-level" class="form-select form-input-sm" onchange="AdminPortal.applyFilters()">
              <option value="">-- ทุกระดับชั้น --</option>
              <option value="ปวช.">ปวช.</option>
              <option value="ปวส. (สายตรง)">ปวส. (สายตรง)</option>
              <option value="ปวส. (ม.6/ปวช. ต่างสาขา)">ปวส. (ม.6/ต่างสาขา)</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">สถานะ:</label>
            <select id="filter-status" class="form-select form-input-sm" onchange="AdminPortal.applyFilters()">
              <option value="">-- ทุกสถานะ --</option>
              <option value="รอตรวจสอบ">รอตรวจสอบ</option>
              <option value="เอกสารไม่ครบ">เอกสารไม่ครบ</option>
              <option value="ผ่านการคัดเลือก">ผ่านการคัดเลือก</option>
              <option value="ไม่ผ่านการคัดเลือก">ไม่ผ่านการคัดเลือก</option>
              <option value="มอบตัวแล้ว">มอบตัวแล้ว</option>
            </select>
          </div>
          <div class="filter-group-actions">
            <button class="btn btn-secondary btn-sm" onclick="AdminPortal.resetFilters()">ล้างตัวกรอง</button>
            <button class="btn btn-primary btn-sm" onclick="AdminPortal.exportToCSV()">ส่งออก Excel / CSV</button>
          </div>
        </div>
      </div>

      <div class="table-summary-bar">
        แสดงผล <strong id="applicant-count">${this.filteredData.length}</strong> จากทั้งหมด ${this.applicantsData.length} รายการ
      </div>

      <div class="table-responsive">
        <table class="official-table">
          <thead>
            <tr>
              <th style="width:100px;">เลขที่สมัคร</th>
              <th style="width:180px;">ชื่อ - สกุล</th>
              <th style="width:110px;">ระดับ</th>
              <th>สาขาวิชาที่เลือก</th>
              <th style="width:70px; text-align:center;">GPAX</th>
              <th style="width:150px;">โรงเรียนเดิม</th>
              <th style="width:120px; text-align:center;">สถานะ</th>
              <th style="width:110px; text-align:center;">รหัสนักเรียน</th>
              <th style="width:130px; text-align:center;">การจัดการ</th>
            </tr>
          </thead>
          <tbody id="applicant-table-body">
            ${this.renderApplicantRows(this.filteredData)}
          </tbody>
        </table>
      </div>

      <!-- Modal ดูรายละเอียดและปรับปรุงสถานะ -->
      <div id="applicant-modal" class="modal-overlay" style="display:none;">
        <div class="modal-box">
          <div class="modal-header">
            <h3 id="modal-title">รายละเอียดผู้สมัคร</h3>
            <button class="modal-close-btn" onclick="AdminPortal.closeModal()">&times;</button>
          </div>
          <div class="modal-body" id="modal-body-content">
            <!-- ข้อมูลโมดัลจะโหลดที่นี่ -->
          </div>
        </div>
      </div>
    `;
  },

  /**
   * สรุปรายการแถวในตาราง
   */
  renderApplicantRows(data) {
    if (!data || data.length === 0) {
      return `<tr><td colspan="9" style="text-align:center; padding:20px; color:#777;">ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา</td></tr>`;
    }

    return data.map(app => {
      const statusBadgeClass = this.getStatusBadgeClass(app.status);
      return `
        <tr>
          <td><strong class="mono-code">${app.id}</strong></td>
          <td>${app.fullName}</td>
          <td>${app.level}</td>
          <td>
            <div>๑. ${app.majorChoice1}</div>
            ${app.majorChoice2 ? `<div style="font-size:12px; color:#666;">๒. ${app.majorChoice2}</div>` : ''}
          </td>
          <td style="text-align:center;"><strong>${app.gpax}</strong></td>
          <td style="font-size:13px;">${app.schoolName}</td>
          <td style="text-align:center;"><span class="badge ${statusBadgeClass}">${app.status}</span></td>
          <td style="text-align:center;"><span class="mono-code">${app.studentId || '-'}</span></td>
          <td style="text-align:center;">
            <button class="btn btn-sm btn-outline" onclick="AdminPortal.openApplicantDetail('${app.id}')">ตรวจสอบ / จัดการ</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  /**
   * แปลงสถานะเป็น CSS Class
   */
  getStatusBadgeClass(status) {
    switch (status) {
      case 'ผ่านการคัดเลือก': return 'badge-success';
      case 'มอบตัวแล้ว': return 'badge-enrolled';
      case 'รอตรวจสอบ': return 'badge-pending';
      case 'เอกสารไม่ครบ': return 'badge-warning';
      case 'ไม่ผ่านการคัดเลือก': return 'badge-danger';
      default: return 'badge-default';
    }
  },

  /**
   * ใช้ตัวกรองตาราง
   */
  applyFilters() {
    const search = (document.getElementById('filter-search')?.value || '').toLowerCase().trim();
    const level = document.getElementById('filter-level')?.value || '';
    const status = document.getElementById('filter-status')?.value || '';

    this.filteredData = this.applicantsData.filter(app => {
      const matchSearch = !search ||
        (app.id && app.id.toLowerCase().includes(search)) ||
        (app.fullName && app.fullName.toLowerCase().includes(search)) ||
        (app.idCard && app.idCard.includes(search)) ||
        (app.schoolName && app.schoolName.toLowerCase().includes(search));

      const matchLevel = !level || app.level === level;
      const matchStatus = !status || app.status === status;

      return matchSearch && matchLevel && matchStatus;
    });

    const body = document.getElementById('applicant-table-body');
    const count = document.getElementById('applicant-count');
    if (body) body.innerHTML = this.renderApplicantRows(this.filteredData);
    if (count) count.textContent = this.filteredData.length;
  },

  /**
   * ล้างค่าตัวกรอง
   */
  resetFilters() {
    if (document.getElementById('filter-search')) document.getElementById('filter-search').value = '';
    if (document.getElementById('filter-level')) document.getElementById('filter-level').value = '';
    if (document.getElementById('filter-status')) document.getElementById('filter-status').value = '';
    this.applyFilters();
  },

  /**
   * เปิด Modal ดูและจัดการผู้สมัคร
   */
  async openApplicantDetail(appId) {
    const app = this.applicantsData.find(a => a.id === appId);
    if (!app) return;
    this.currentApplicant = app;

    const modal = document.getElementById('applicant-modal');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-body-content');

    title.textContent = `ตรวจสอบและจัดการใบสมัคร: ${app.id} - ${app.fullName}`;

    // โหลด Status Logs
    const logRes = await GasApi.request('getStatusLogs', { applicationId: app.id });
    const logs = logRes.data || [];

    content.innerHTML = `
      <div class="modal-split">
        <div class="modal-left">
          <div class="section-title-sm">ข้อมูลทั่วไปของผู้สมัคร</div>
          <table class="detail-grid-table">
            <tr><th style="width:140px;">ระดับที่สมัคร:</th><td><strong>${app.level}</strong></td></tr>
            <tr><th>สาขาอันดับ ๑:</th><td><strong>${app.majorChoice1}</strong></td></tr>
            ${app.majorChoice2 ? `<tr><th>สาขาอันดับ ๒:</th><td>${app.majorChoice2}</td></tr>` : ''}
            <tr><th>เลขบัตรประชาชน:</th><td>${Validator.formatThaiID(app.idCard)}</td></tr>
            <tr><th>วันเดือนปีเกิด:</th><td>${app.birthDate}</td></tr>
            <tr><th>หมายเลขโทรศัพท์:</th><td>${Validator.formatPhone(app.phone)}</td></tr>
            <tr><th>สถานศึกษาเดิม:</th><td>${app.schoolName} (${app.schoolLocation})</td></tr>
            <tr><th>เกรดเฉลี่ย (GPAX):</th><td><strong>${app.gpax}</strong> (สาขาเดิม: ${app.oldMajor || '-'})</td></tr>
            <tr><th>ที่อยู่:</th><td>${app.houseNo || ''} ม.${app.moo || ''} ต.${app.subdistrict || ''} อ.${app.district || ''} จ.${app.province || ''} ${app.postalCode || ''}</td></tr>
            <tr><th>บิดา:</th><td>${app.fatherName || '-'} (อาชีพ: ${app.fatherJob || '-'})</td></tr>
            <tr><th>มารดา:</th><td>${app.motherName || '-'} (อาชีพ: ${app.motherJob || '-'})</td></tr>
            <tr><th>รหัสนักเรียน:</th><td><strong style="color:#1F3A5F; font-size:15px;">${app.studentId || 'ยังไม่มีการออกรหัส'}</strong></td></tr>
          </table>

          <div class="section-title-sm" style="margin-top:15px;">เอกสารหลักฐานแนบ</div>
          <div class="doc-attachment-list">
            <div class="doc-item">
              <span>๑. รูปถ่ายหน้าตรง:</span>
              <a href="${app.documents?.photo?.url || 'assets/logo.png'}" target="_blank" class="btn btn-xs btn-outline">ดูรูปถ่าย</a>
            </div>
            <div class="doc-item">
              <span>๒. ผลการเรียน ๕ ภาคเรียน (ปพ.๑):</span>
              <a href="${app.documents?.transcript?.url || '#'}" target="_blank" class="btn btn-xs btn-outline">ดูเอกสารผลการเรียน</a>
            </div>
            <div class="doc-item">
              <span>๓. สำเนาบัตร/ทะเบียนบ้าน:</span>
              <a href="${app.documents?.idCopy?.url || '#'}" target="_blank" class="btn btn-xs btn-outline">ดูสำเนาบัตร</a>
            </div>
            ${app.documents?.cert ? `
              <div class="doc-item">
                <span>๔. เกียรติบัตร/ผลงาน:</span>
                <a href="${app.documents.cert.url}" target="_blank" class="btn btn-xs btn-outline">ดูเกียรติบัตร</a>
              </div>
            ` : ''}
          </div>

          <div style="margin-top:15px;">
            <button class="btn btn-sm btn-secondary" onclick="PdfGenerator.openPrintPreview(AdminPortal.currentApplicant)">
              พิมพ์ใบสมัครทางการ (A4)
            </button>
          </div>
        </div>

        <div class="modal-right">
          <div class="section-title-sm">ปรับปรุงสถานะและบันทึกผลการคัดเลือก</div>
          <form onsubmit="AdminPortal.handleUpdateStatus(event)">
            <div class="form-group">
              <label class="form-label">สถานะปัจจุบัน:</label>
              <select id="modal-update-status" class="form-select">
                <option value="รอตรวจสอบ" ${app.status === 'รอตรวจสอบ' ? 'selected' : ''}>รอตรวจสอบ</option>
                <option value="เอกสารไม่ครบ" ${app.status === 'เอกสารไม่ครบ' ? 'selected' : ''}>เอกสารไม่ครบ (ต้องแก้ไข)</option>
                <option value="ผ่านการคัดเลือก" ${app.status === 'ผ่านการคัดเลือก' ? 'selected' : ''}>ผ่านการคัดเลือก</option>
                <option value="ไม่ผ่านการคัดเลือก" ${app.status === 'ไม่ผ่านการคัดเลือก' ? 'selected' : ''}>ไม่ผ่านการคัดเลือก</option>
                <option value="มอบตัวแล้ว" ${app.status === 'มอบตัวแล้ว' ? 'selected' : ''}>มอบตัวแล้ว (ออกรหัสนักเรียน)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">หมายเหตุ / แจ้งเตือนผู้สมัคร:</label>
              <textarea id="modal-update-notes" class="form-textarea" rows="3" placeholder="ระบุเหตุผล หรือระบุเอกสารที่ต้องแนบเพิ่มเติม">${app.notes || ''}</textarea>
            </div>
            <div class="form-group">
              <label class="checkbox-container">
                <input type="checkbox" id="modal-send-notify" checked />
                <span>ส่งข้อความแจ้งเตือนผลผ่าน LINE / อีเมล</span>
              </label>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;">บันทึกการเปลี่ยนแปลงสถานะ</button>
          </form>

          <div class="section-title-sm" style="margin-top:20px;">ประวัติการเปลี่ยนแปลงสถานะ (Audit Log)</div>
          <div class="audit-log-list">
            ${logs.length > 0 ? logs.map(l => `
              <div class="log-item">
                <div class="log-meta">
                  <span>${l.timestamp}</span> | <span>ผู้ดำเนินการ: ${l.changedBy}</span>
                </div>
                <div class="log-change">
                  จาก: <strong>${l.oldStatus}</strong> ➔ เป็น: <strong>${l.newStatus}</strong>
                </div>
                ${l.notes ? `<div class="log-note">หมายเหตุ: ${l.notes}</div>` : ''}
              </div>
            `).join('') : '<div style="color:#777; font-size:12px;">ยังไม่มีประวัติการเปลี่ยนแปลง</div>'}
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  },

  /**
   * ปิด Modal
   */
  closeModal() {
    const modal = document.getElementById('applicant-modal');
    if (modal) modal.style.display = 'none';
    this.currentApplicant = null;
  },

  /**
   * บันทึกการเปลี่ยนสถานะ
   */
  async handleUpdateStatus(e) {
    e.preventDefault();
    if (!this.currentApplicant) return;

    const newStatus = document.getElementById('modal-update-status').value;
    const notes = document.getElementById('modal-update-notes').value.trim();
    const sendNotify = document.getElementById('modal-send-notify').checked;

    const res = await GasApi.request('updateStatus', {
      applicationId: this.currentApplicant.id,
      newStatus,
      notes,
      staffName: this.currentStaff.fullName,
      staffRole: this.currentStaff.role,
      sendNotify
    });

    if (res.success) {
      alert('บันทึกการเปลี่ยนแปลงสถานะเรียบร้อยแล้ว');
      this.closeModal();
      this.loadApplicantsTab(document.getElementById('staff-tab-content'));
    } else {
      alert('เกิดข้อผิดพลาด: ' + res.message);
    }
  },

  /**
   * ส่งออกข้อมูลผู้สมัครเป็น CSV / Excel ภาษาไทย
   */
  exportToCSV() {
    if (!this.filteredData || this.filteredData.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = [
      'เลขที่ใบสมัคร',
      'ปีการศึกษา',
      'ระดับชั้น',
      'คำนำหน้า',
      'ชื่อ',
      'นามสกุล',
      'ชื่อ-สกุลเต็ม',
      'เลขประจำตัวประชาชน',
      'วันเดือนปีเกิด',
      'เบอร์โทรศัพท์',
      'เกรดเฉลี่ยสะสม',
      'โรงเรียนเดิม',
      'จังหวัดโรงเรียนเดิม',
      'สาขาวิชาที่เลือก_อันดับ1',
      'สาขาวิชาที่เลือก_อันดับ2',
      'สถานะ',
      'หมายเหตุ',
      'รหัสประจำตัวนักเรียน',
      'วันที่สมัคร'
    ];

    const rows = this.filteredData.map(a => [
      `"${a.id}"`,
      `"${a.academicYear}"`,
      `"${a.level}"`,
      `"${a.prefix}"`,
      `"${a.firstName}"`,
      `"${a.lastName}"`,
      `"${a.fullName}"`,
      `"'\t${a.idCard}"`, // เติมเพื่อป้องกัน Excel ตัดเลข 0 หรือแสดงวิทยาศาสตร์
      `"${a.birthDate}"`,
      `"'\t${a.phone}"`,
      `"${a.gpax}"`,
      `"${a.schoolName}"`,
      `"${a.province}"`,
      `"${a.majorChoice1}"`,
      `"${a.majorChoice2 || ''}"`,
      `"${a.status}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`,
      `"'\t${a.studentId || ''}"`,
      `"${a.createdAt}"`
    ]);

    // เติม UTF-8 BOM (\uFEFF) เพื่อให้ Microsoft Excel เปิดภาษาไทยได้โดยไม่เป็นภาษาต่างดาว
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ทะเบียนผู้สมัครโควตา2570_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // ==========================================
  // แท็บที่ 2: สถิติและรายงานสรุป (Dashboard)
  // ==========================================
  async loadDashboardTab(container) {
    container.innerHTML = '<div class="loading-spinner">กำลังประมวลผลสถิติ...</div>';

    const res = await GasApi.request('getApplicants');
    if (!res.success) {
      container.innerHTML = `<div class="alert-box alert-error">ไม่สามารถดึงข้อมูลสถิติได้</div>`;
      return;
    }

    const apps = res.data || [];
    const total = apps.length;

    // คำนวณสถิติ
    const countByLevel = {};
    const countByMajor = {};
    const countBySchool = {};
    const countByProvince = {};
    const countByStatus = {
      'รอตรวจสอบ': 0,
      'เอกสารไม่ครบ': 0,
      'ผ่านการคัดเลือก': 0,
      'ไม่ผ่านการคัดเลือก': 0,
      'มอบตัวแล้ว': 0
    };

    apps.forEach(a => {
      countByLevel[a.level] = (countByLevel[a.level] || 0) + 1;
      countByMajor[a.majorChoice1] = (countByMajor[a.majorChoice1] || 0) + 1;
      countBySchool[a.schoolName] = (countBySchool[a.schoolName] || 0) + 1;
      countByProvince[a.province] = (countByProvince[a.province] || 0) + 1;
      if (countByStatus[a.status] !== undefined) {
        countByStatus[a.status]++;
      }
    });

    // ดึง Top 5 โรงเรียนและจังหวัด
    const topSchools = Object.entries(countBySchool).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const topProvinces = Object.entries(countByProvince).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const majorsList = Object.entries(countByMajor).sort((a,b) => b[1] - a[1]);

    container.innerHTML = `
      <!-- ตัวเลขสรุปสถิติสำคัญ (KPIs) -->
      <div class="stats-overview-grid">
        <div class="stat-card">
          <div class="stat-num">${total}</div>
          <div class="stat-label">ผู้สมัครทั้งหมด (คน)</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${countByLevel['ปวช.'] || 0}</div>
          <div class="stat-label">ระดับ ปวช.</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${(countByLevel['ปวส. (สายตรง)'] || 0) + (countByLevel['ปวส. (ม.6/ปวช. ต่างสาขา)'] || 0)}</div>
          <div class="stat-label">ระดับ ปวส. รวม</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${countByStatus['ผ่านการคัดเลือก']}</div>
          <div class="stat-label">ผ่านการคัดเลือก</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${countByStatus['มอบตัวแล้ว']}</div>
          <div class="stat-label">มอบตัวแล้ว</div>
        </div>
      </div>

      <!-- สรุปสถานะการรับสมัคร -->
      <div class="dashboard-grid" style="margin-top:20px;">
        <div class="card">
          <div class="card-header-navy">สัดส่วนสถานะการรับสมัคร</div>
          <div class="card-body">
            <div class="chart-list">
              ${Object.entries(countByStatus).map(([st, cnt]) => {
                const pct = total > 0 ? ((cnt / total) * 100).toFixed(1) : 0;
                return `
                  <div class="chart-bar-item">
                    <div class="chart-bar-label">
                      <span>${st}</span>
                      <span><strong>${cnt}</strong> คน (${pct}%)</span>
                    </div>
                    <div class="chart-bar-track">
                      <div class="chart-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header-navy">ผู้สมัครแยกตามระดับการศึกษา</div>
          <div class="card-body">
            <div class="chart-list">
              ${Object.entries(countByLevel).map(([lvl, cnt]) => {
                const pct = total > 0 ? ((cnt / total) * 100).toFixed(1) : 0;
                return `
                  <div class="chart-bar-item">
                    <div class="chart-bar-label">
                      <span>${lvl}</span>
                      <span><strong>${cnt}</strong> คน (${pct}%)</span>
                    </div>
                    <div class="chart-bar-track">
                      <div class="chart-bar-fill fill-secondary" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- แยกตามสาขาวิชา และ สถานศึกษาเดิม -->
      <div class="dashboard-grid" style="margin-top:20px;">
        <div class="card">
          <div class="card-header-navy">จำนวนผู้สมัครแยกตามสาขาวิชา (อันดับ ๑)</div>
          <div class="card-body">
            <div class="chart-list">
              ${majorsList.map(([major, cnt]) => {
                const pct = total > 0 ? ((cnt / total) * 100).toFixed(1) : 0;
                return `
                  <div class="chart-bar-item">
                    <div class="chart-bar-label">
                      <span>${major}</span>
                      <span><strong>${cnt}</strong> คน</span>
                    </div>
                    <div class="chart-bar-track">
                      <div class="chart-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header-navy">สถานศึกษาเดิมและจังหวัดที่มีผู้สมัครสูงสุด</div>
          <div class="card-body">
            <div class="section-title-sm" style="margin-bottom:8px;">๕ ลำดับสถานศึกษาเดิมที่มีผู้สมัครมากที่สุด:</div>
            <ul class="data-rank-list">
              ${topSchools.map(([sch, cnt], idx) => `
                <li>
                  <span class="rank-idx">${idx + 1}.</span>
                  <span class="rank-name">${sch}</span>
                  <span class="rank-val">${cnt} คน</span>
                </li>
              `).join('')}
            </ul>

            <div class="section-title-sm" style="margin-top:20px; margin-bottom:8px;">๕ ลำดับจังหวัดภูมิลำเนาของผู้สมัคร:</div>
            <ul class="data-rank-list">
              ${topProvinces.map(([prov, cnt], idx) => `
                <li>
                  <span class="rank-idx">${idx + 1}.</span>
                  <span class="rank-name">${prov}</span>
                  <span class="rank-val">${cnt} คน</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  },

  // ==========================================
  // แท็บที่ 3: ตั้งค่าระบบรับสมัคร (Settings)
  // ==========================================
  async loadSettingsTab(container) {
    container.innerHTML = '<div class="loading-spinner">กำลังโหลดการตั้งค่า...</div>';

    const res = await GasApi.request('getSettings');
    const settings = res.data || {};

    container.innerHTML = `
      <div class="card">
        <div class="card-header-navy">ตั้งค่าระบบรับสมัครและประกาศวิทยาลัย</div>
        <div class="card-body">
          <form onsubmit="AdminPortal.handleSaveSettings(event)">
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">สถานะการเปิดรับสมัคร:</label>
                <select id="set-is-open" class="form-select">
                  <option value="true" ${settings.isOpen ? 'selected' : ''}>เปิดรับสมัครตามปกติ</option>
                  <option value="false" ${!settings.isOpen ? 'selected' : ''}>ปิดระบบรับสมัครชั่วคราว</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">ปีการศึกษาที่เปิดรับ:</label>
                <input type="text" id="set-academic-year" class="form-input" value="${settings.academicYear || '2570'}" required />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">วันที่เริ่มรับสมัคร:</label>
                <input type="date" id="set-start-date" class="form-input" value="${settings.startDate || '2027-01-05'}" required />
              </div>
              <div class="form-group">
                <label class="form-label">วันสิ้นสุดการรับสมัคร:</label>
                <input type="date" id="set-end-date" class="form-input" value="${settings.endDate || '2027-02-28'}" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">หัวข้อประกาศหน้าแรก:</label>
              <input type="text" id="set-announcement-title" class="form-input" value="${settings.announcementTitle || ''}" required />
            </div>

            <div class="form-group">
              <label class="form-label">เนื้อหาประกาศหน้าแรก:</label>
              <textarea id="set-announcement-body" class="form-textarea" rows="4" required>${settings.announcementBody || ''}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">เกณฑ์คุณสมบัติผู้สมัครโควตา:</label>
              <textarea id="set-quota-qual" class="form-textarea" rows="3" required>${settings.quotaQualifications || ''}</textarea>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">รายชื่อสาขาวิชา ระดับ ปวช. (คั่นด้วยเครื่องหมายจุลภาค ,):</label>
                <textarea id="set-majors-voc" class="form-textarea" rows="5" required>${(settings.majorsVocational || []).join(', ')}</textarea>
                <div class="field-hint">ระบบจะนำไปแสดงในดรอปดาวน์เลือกสาขา ปวช. โดยอัตโนมัติ</div>
              </div>
              <div class="form-group">
                <label class="form-label">รายชื่อสาขาวิชา ระดับ ปวส. (คั่นด้วยเครื่องหมายจุลภาค ,):</label>
                <textarea id="set-majors-high" class="form-textarea" rows="5" required>${(settings.majorsHighVocational || []).join(', ')}</textarea>
                <div class="field-hint">ระบบจะนำไปแสดงในดรอปดาวน์เลือกสาขา ปวส. โดยอัตโนมัติ</div>
              </div>
            </div>

            <div class="section-divider"></div>

            <div class="form-group">
              <label class="form-label">URL ของ Google Apps Script Web App (สำหรับเชื่อมต่อชีตจริง):</label>
              <input type="url" id="set-gas-url" class="form-input" placeholder="https://script.google.com/macros/s/.../exec" value="${GasApi.getBackendUrl()}" />
              <div class="field-hint">หากเว้นว่าง ระบบจะทำงานในโหมดจำลอง (Local Test Mode) อัตโนมัติ</div>
            </div>

            <div class="form-actions" style="margin-top:20px;">
              <button type="submit" class="btn btn-primary">บันทึกการตั้งค่าทั้งหมด</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  /**
   * บันทึกการตั้งค่าระบบ
   */
  async handleSaveSettings(e) {
    e.preventDefault();

    const gasUrl = document.getElementById('set-gas-url').value.trim();
    GasApi.setBackendUrl(gasUrl);

    const updatedSettings = {
      isOpen: document.getElementById('set-is-open').value === 'true',
      academicYear: document.getElementById('set-academic-year').value.trim(),
      startDate: document.getElementById('set-start-date').value,
      endDate: document.getElementById('set-end-date').value,
      announcementTitle: document.getElementById('set-announcement-title').value.trim(),
      announcementBody: document.getElementById('set-announcement-body').value.trim(),
      quotaQualifications: document.getElementById('set-quota-qual').value.trim(),
      majorsVocational: document.getElementById('set-majors-voc').value.split(',').map(s => s.trim()).filter(Boolean),
      majorsHighVocational: document.getElementById('set-majors-high').value.split(',').map(s => s.trim()).filter(Boolean)
    };

    const res = await GasApi.request('updateSettings', { settings: updatedSettings });
    if (res.success) {
      alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      // รีโหลดข้อมูลหน้าแรกด้วย
      if (window.App && window.App.loadHomeData) {
        window.App.loadHomeData();
      }
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + res.message);
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminPortal;
}
