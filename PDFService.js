// ==========================================
// File: PDFService.js
// ==========================================

// 1. นำเข้าฟอนต์จากไฟล์ที่คุณทำไว้ (อันนี้ถูกต้องแล้ว)
import { thSarabunNewBase64, fontName, fontStyle, addThaiFont } from './src/fonts/SarabunNew.js';

// 2. ดึง jsPDF มาจากหน้าเว็บ (แก้ปัญหา Error: failed to resolve module specifier "jspdf")
const { jsPDF } = window.jspdf; 

export const generateSalarySlipPDF = async (data) => {
    try {
        // สร้างเอกสาร PDF A4 แนวตั้ง
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        // เพิ่มฟอนต์ภาษาไทย
        addThaiFont(doc);

        // ตั้งค่าฟอนต์เริ่มต้น
        doc.setFont(fontName, fontStyle);
        doc.setFontSize(16);

        // --- ส่วนหัวเอกสาร ---
        doc.text("ใบแจ้งเงินเดือน / Salary Slip", 105, 20, { align: "center" });
        doc.setFontSize(12);
        doc.text(`รหัสพนักงาน: ${data.empId || '-'}`, 20, 35);
        doc.text(`ชื่อ-นามสกุล: ${data.name || '-'}`, 20, 42);
        doc.text(`ตำแหน่ง: ${data.position || '-'}`, 20, 49);
        
        // วันที่/เดือน (มุมขวา)
        doc.text(`วันที่: ${new Date().toLocaleDateString('th-TH')}`, 140, 35);

        // --- เส้นคั่น ---
        doc.setLineWidth(0.5);
        doc.line(20, 55, 190, 55);

        // --- รายละเอียดเงินเดือน (ตัวอย่าง) ---
        let yPos = 65;
        doc.text("รายการรับ (Income)", 20, yPos);
        doc.text("รายการหัก (Deduction)", 110, yPos);
        
        yPos += 10;
        // รายรับ
        doc.text(`เงินเดือน: ${data.salary || 0}`, 20, yPos);
        doc.text(`ค่าล่วงเวลา: ${data.ot || 0}`, 20, yPos + 7);
        
        // รายจ่าย
        doc.text(`ประกันสังคม: ${data.socialSecurity || 0}`, 110, yPos);
        doc.text(`ภาษี: ${data.tax || 0}`, 110, yPos + 7);

        // --- ยอดสุทธิ ---
        doc.line(20, yPos + 20, 190, yPos + 20);
        doc.setFontSize(14);
        doc.text(`เงินได้สุทธิ (Net Salary): ${data.netSalary || 0} บาท`, 140, yPos + 30, { align: "right" });

        // บันทึกไฟล์
        doc.save(`SalarySlip_${data.empId}.pdf`);
        
        return true;

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("เกิดข้อผิดพลาดในการสร้าง PDF: " + error.message);
        return false;
    }
};
```

---

#### 2. แก้ไขไฟล์ `index.html` (แก้ปัญหา checkPin)
ให้เข้าไปแก้ไขไฟล์ `index.html` ตรงส่วนที่เป็น `<script>` ด้านล่างสุด (ที่อยู่ก่อนปิด `</body>`)

ให้เปลี่ยน **วิธีประกาศฟังก์ชัน checkPin** ให้เป็นแบบ `window.checkPin` เพื่อให้ปุ่มกดรู้จักครับ

**หาโค้ดส่วนนี้ (ด้านล่างๆ ของไฟล์ index.html):**
```html
<script type="module">
    import { generateSalarySlipPDF } from './PDFService.js';
    
    // ... โค้ดอื่นๆ ...

    function checkPin() {  // <--- จุดที่ต้องแก้
        // ...
    }
</script>
```

**แก้เป็นแบบนี้ครับ (ก๊อปไปทับส่วน script เดิมได้เลย):**
```html
    <!-- Script หลักของหน้าเว็บ -->
    <script type="module">
        // นำเข้าฟังก์ชันสร้าง PDF
        import { generateSalarySlipPDF } from './PDFService.js';

        // ตัวแปรเก็บรหัสผ่านที่ถูกต้อง
        const CORRECT_PIN = "1234"; // เปลี่ยนรหัสตามต้องการ

        // *** แก้ไขตรงนี้: ใช้ window.checkPin เพื่อให้ HTML มองเห็นฟังก์ชัน ***
        window.checkPin = async function() {
            const pinInput = document.getElementById('pinInput');
            const pin = pinInput.value;

            if (pin === CORRECT_PIN) {
                // ล็อกอินผ่าน
                document.getElementById('loginCard').classList.add('hidden');
                document.getElementById('mainContent').classList.remove('hidden');
                
                // แจ้งเตือนสวยๆ
                Swal.fire({
                    icon: 'success',
                    title: 'เข้าสู่ระบบสำเร็จ',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                // รหัสผิด
                Swal.fire({
                    icon: 'error',
                    title: 'รหัสผ่านไม่ถูกต้อง',
                    text: 'กรุณาลองใหม่อีกครั้ง'
                });
                pinInput.value = '';
            }
        }
        
        // ฟังก์ชันสำหรับปุ่ม Enter
        window.handleKeyPress = function(event) {
            if (event.key === "Enter") {
                window.checkPin();
            }
        }

        // ฟังก์ชันสร้าง PDF (ผูกกับปุ่ม Print)
        window.printPDF = async function() {
            // ดึงข้อมูลสมมติ หรือจาก Form
            const mockData = {
                empId: "EMP001",
                name: "ทดสอบ ระบบ",
                position: "พนักงานทั่วไป",
                salary: "25,000",
                ot: "2,000",
                socialSecurity: "750",
                tax: "500",
                netSalary: "25,750"
            };

            // เรียกใช้ไฟล์ PDFService.js
            await generateSalarySlipPDF(mockData);
        }
    </script>
</body>
