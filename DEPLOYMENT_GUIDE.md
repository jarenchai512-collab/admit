# คู่มือการติดตั้งและนำขึ้นใช้งาน (Deployment Guide)
## ระบบรับสมัครเรียนออนไลน์ (โควตา) วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา ๒๕๗๐

---

## ขั้นตอนที่ ๑: การติดตั้งฐานข้อมูล Google Sheets และ Google Apps Script

### ๑.๑ สร้าง Google Spreadsheet ใหม่
1. ไปที่ [Google Sheets](https://sheets.new) และสร้าง Spreadsheet ใหม่
2. ตั้งชื่อไฟล์ Spreadsheet ว่า: `ฐานข้อมูลรับสมัครโควตา_2570_วท.ท่าหลวงฯ`

### ๑.๒ เปิด Apps Script Editor
1. ที่เมนูด้านบนของ Google Sheets คลิกที่ **ส่วนขยาย (Extensions)** ➔ **Apps Script**
2. ตั้งชื่อโปรเจกต์ Apps Script ว่า: `TTC_Admission_2570_Backend`

### ๑.๓ คัดลอกไฟล์สคริปต์ลงในโปรเจกต์
ในโฟลเดอร์ `google-apps-script/` จะมีไฟล์ทั้งหมด ๗ ไฟล์ ให้สร้างไฟล์ใน Apps Script Editor ตามชื่อเดียวกันและคัดลอกโค้ดไปวาง:

1. **`Code.gs`** - ควบคุมคำขอ GET / POST และเป็น API Gateway
2. **`Setup.gs`** - สคริปต์สร้างฐานข้อมูล ๕ ชีตและโฟลเดอร์ Google Drive
3. **`ApplicantService.gs`** - บริการรับสมัคร, ตรวจเลขซ้ำ, สร้างรหัส Q70-xxxx
4. **`DocumentService.gs`** - บริการจัดเก็บไฟล์แนบลง Google Drive
5. **`StatusService.gs`** - บริการจัดการสถานะ, มอบตัว, ออกรหัสนักเรียน 7020901xxxx
6. **`NotificationService.gs`** - บริการส่งแจ้งเตือน LINE Notify และ Email
7. **`appsscript.json`** - (คลิกการตั้งค่าโปรเจกต์ ➔ ติ๊กเลือก "แสดงไฟล์ manifest appsscript.json ในตัวแก้ไข") แล้ววางเนื้อหาจาก `appsscript.json`

### ๑.๔ เรียกใช้ฟังก์ชันติดตั้งฐานข้อมูล (ครั้งแรก)
1. ในหน้า Apps Script Editor เลือกฟังก์ชัน **`setupDatabase`** (จากไฟล์ `Setup.gs`)
2. คลิกปุ่ม **เรียกใช้ (Run)**
3. ระบบจะขออนุญาตสิทธิ์เข้าถึง (Authorization Required) ให้คลิก **ตรวจสอบสิทธิ์ (Review Permissions)** ➔ เลือกบัญชี Google ของท่าน ➔ คลิก **ขั้นสูง (Advanced)** ➔ คลิก **ไปที่ TTC_Admission_2570_Backend (ไม่ปลอดภัย)** ➔ คลิก **อนุญาต (Allow)**
4. เมื่อสคริปต์ทำงานเสร็จ:
   * ใน Google Sheets จะมีชีตทั้ง ๕ ชีตถูกสร้างขึ้นพร้อมหัวตารางสีน้ำเงินเข้ม:
     * `Applicants`
     * `Documents`
     * `StatusLog`
     * `Staff`
     * `Settings`
   * ใน Google Drive จะมีโฟลเดอร์ชื่อ `เอกสารรับสมัครโควตา_2570_วท.ท่าหลวงฯ` ถูกสร้างขึ้นโดยอัตโนมัติ

---

## ขั้นตอนที่ ๒: การเผยแพร่ Google Apps Script เป็น Web App (Deploy)

1. ที่มุมขวาบนของ Apps Script Editor คลิกปุ่ม **การทำให้ใช้งานได้ (Deploy)** ➔ **การทำให้ใช้งานได้รายการใหม่ (New deployment)**
2. คลิกที่รูปเฟือง (ตั้งค่าประเภท) ➔ เลือก **เว็บแอป (Web app)**
3. ตั้งค่าดังนี้:
   * **คำอธิบาย (Description):** `Production v1.0`
   * **ดำเนินการในรูปแบบ (Execute as):** `ฉัน (อีเมลของท่าน / Me)`
   * **ผู้ที่มีสิทธิ์เข้าถึง (Who has access):** `ทุกคน (Anyone)` *(สำคัญมาก เพื่อให้ผู้สมัครภายนอกสามารถส่งฟอร์มได้)*
4. คลิกปุ่ม **ทำให้ใช้งานได้ (Deploy)**
5. คัดลอก **URL ของเว็บแอป (Web App URL)** ที่ลงท้ายด้วย `/exec` เช่น:
   `https://script.google.com/macros/s/AKfycbx.../exec`

---

## ขั้นตอนที่ ๓: เชื่อมต่อ Web App URL กับหน้าเว็บ

1. เปิดหน้าเว็บ `index.html` บนเบราว์เซอร์
2. ไปที่เมนู **เจ้าหน้าที่** ➔ เข้าสู่ระบบด้วย:
   * **ชื่อผู้ใช้:** `admin`
   * **รหัสผ่าน:** `password123`
3. ไปที่แท็บ **ตั้งค่าระบบรับสมัคร**
4. เลื่อนลงมาที่ช่อง **URL ของ Google Apps Script Web App** แล้ววาง URL ที่คัดลอกมาในขั้นตอนที่ ๒
5. คลิกปุ่ม **บันทึกการตั้งค่าทั้งหมด**
*(ระบบจะสลับจากโหมดจำลองในเครื่องมาเชื่อมต่อกับ Google Sheets และ Google Drive จริงทันที)*

---

## ขั้นตอนที่ ๔: การนำขึ้น GitHub และเปิดใช้งาน GitHub Pages

### ๔.๑ เตรียม Git Repository ในเครื่อง
เปิดเทอร์มินัล (PowerShell หรือ Git Bash) ในโฟลเดอร์โปรเจกต์นี้:

```bash
# ตรวจสอบสถานะและตั้งค่าชื่อผู้ใช้ (หากยังไม่ได้ตั้ง)
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"

# เพิ่มไฟล์ทั้งหมดและ Commit
git add .
git commit -m "feat: ระบบรับสมัครเรียนออนไลน์ (โควตา) ๒๕๗๐ วท.ท่าหลวงซิเมนต์ไทยอนุสรณ์"
```

### ๔.๒ เชื่อมโยงและ Push โค้ดไปยัง GitHub Repository
Repository ได้รับการเชื่อมโยงและ Push ไปยัง:
`https://github.com/jarenchai512-collab/admit.git`

```bash
git remote add origin https://github.com/jarenchai512-collab/admit.git
git branch -M main
git push -u origin main
```

### ๔.๓ เปิดใช้งาน GitHub Pages สำหรับเผยแพร่เว็บ
1. ไปที่หน้า Repository บน GitHub: [https://github.com/jarenchai512-collab/admit/settings/pages](https://github.com/jarenchai512-collab/admit/settings/pages)
2. ภายใต้หัวข้อ **Build and deployment**:
   * **Source:** สามารถเลือกได้ ๒ รูปแบบ:
     - **GitHub Actions:** ระบบได้เตรียมไฟล์ Workflow อัตโนมัติไว้ให้เรียบร้อยแล้ว
     - **Deploy from a branch:** เลือก branch `main` และโฟลเดอร์ `/ (root)` แล้วกด **Save**
3. เมื่อเปิดใช้งาน เว็บไซต์จะออนไลน์พร้อมใช้งานทันทีที่:
   **[https://jarenchai512-collab.github.io/admit/](https://jarenchai512-collab.github.io/admit/)**

---

## ๕. การตั้งค่าเพิ่มเติม (ตัวเลือกเสริม)

### ๕.๑ การตั้งค่า LINE Notify
1. ไปที่ [LINE Notify Service](https://notify-bot.line.me/) เข้าสู่ระบบด้วยบัญชี LINE
2. ไปที่ **หน้าของฉัน (My Page)** ➔ คลิก **ออก Token (Generate token)**
3. ตั้งชื่อแจ้งเตือน เช่น `งานรับสมัคร วท.ท่าหลวงฯ` และเลือกกลุ่มหรือห้องแชทที่ต้องการรับแจ้งเตือน
4. นำ Token ที่ได้ ไปใส่ในชีต `Settings` ที่แถว `lineNotifyToken`

### ๕.๒ การเปลี่ยนอีเมลรับการแจ้งเตือน
สามารถเปลี่ยนอีเมลสำหรับรับข้อความแจ้งเตือนผู้สมัครใหม่ได้ที่ชีต `Settings` ที่แถว `adminEmail` (ค่าเริ่มต้นคือ `saraban@tl.ac.th`)
