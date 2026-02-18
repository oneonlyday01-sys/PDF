// ==========================================
// File: PDFService.js
// ==========================================

// 1. นำเข้าฟอนต์จากไฟล์
import { thSarabunNewBase64, fontName, fontStyle, addThaiFont } from './src/fonts/SarabunNew.js';

// 2. ดึง jsPDF มาจากหน้าเว็บ
const { jsPDF } = window.jspdf;

// Helper: ตั้งค่าเริ่มต้นและฟอนต์
const initDoc = () => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });
    addThaiFont(doc);
    doc.setFont(fontName, fontStyle);
    return doc;
};

// ==========================================
// 1. ฟังก์ชันสร้างสลิปเงินเดือน (รองรับทั้งแบบเดี่ยวและแบบ Array)
// ==========================================
export const generatePayslip = async (dataArray) => {
    try {
        const doc = initDoc();
        
        dataArray.forEach((data, index) => {
            if (index > 0) doc.addPage();

            doc.setFontSize(16);
            // --- ส่วนหัวเอกสาร ---
            doc.text("ใบแจ้งเงินเดือน / Salary Slip", 105, 20, { align: "center" });
            
            doc.setFontSize(12);
            doc.text(`ชื่อ-นามสกุล: ${data.name || '-'}`, 20, 35);
            doc.text(`ตำแหน่ง: ${data.pos || '-'}`, 20, 42);
            doc.text(`งวดที่: ${data.period || '-'} ประจำเดือน: ${data.month}/${data.year}`, 190, 35, { align: "right" });
            doc.text(`วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH')}`, 190, 42, { align: "right" });

            // --- เส้นคั่น ---
            doc.setLineWidth(0.5);
            doc.line(20, 48, 190, 48);

            // --- รายละเอียดเงินเดือน ---
            let yPos = 58;
            doc.setFontSize(14);
            doc.text("รายการรับ (Income)", 20, yPos);
            doc.text("รายการหัก (Deduction)", 110, yPos);
            
            doc.setFontSize(12);
            yPos += 10;
            
            // รายรับ
            doc.text(`เงินเดือน:`, 20, yPos);
            doc.text(`${Number(data.salary).toLocaleString()}`, 90, yPos, { align: "right" });
            
            doc.text(`ค่าล่วงเวลา/เบี้ยเลี้ยง:`, 20, yPos + 8);
            doc.text(`${Number(data.incentive).toLocaleString()}`, 90, yPos + 8, { align: "right" });
            
            doc.text(`อื่นๆ:`, 20, yPos + 16);
            doc.text(`${Number(data.other).toLocaleString()}`, 90, yPos + 16, { align: "right" });

            const totalIncome = (parseFloat(data.salary) + parseFloat(data.incentive) + parseFloat(data.other));
            doc.setFontSize(12);
            doc.text(`รวมรายรับ:`, 20, yPos + 30);
            doc.text(`${totalIncome.toLocaleString()}`, 90, yPos + 30, { align: "right" });

            // รายจ่าย (Column ขวา)
            doc.text(`ประกันสังคม:`, 110, yPos);
            doc.text(`${Number(data.sso).toLocaleString()}`, 190, yPos, { align: "right" });
            
            doc.text(`ภาษี:`, 110, yPos + 8);
            doc.text(`${Number(data.tax).toLocaleString()}`, 190, yPos + 8, { align: "right" });
            
            doc.text(`เบิกล่วงหน้า:`, 110, yPos + 16);
            doc.text(`${Number(data.advance).toLocaleString()}`, 190, yPos + 16, { align: "right" });

            doc.text(`ค่าน้ำ/ไฟ:`, 110, yPos + 24);
            doc.text(`${Number((parseFloat(data.water) + parseFloat(data.electricity))).toLocaleString()}`, 190, yPos + 24, { align: "right" });

            const totalDeduct = (parseFloat(data.sso) + parseFloat(data.tax) + parseFloat(data.advance) + parseFloat(data.water) + parseFloat(data.electricity));
            doc.text(`รวมรายจ่าย:`, 110, yPos + 30);
            doc.text(`${totalDeduct.toLocaleString()}`, 190, yPos + 30, { align: "right" });

            // --- ยอดสุทธิ ---
            doc.line(20, yPos + 38, 190, yPos + 38);
            doc.setFontSize(16);
            doc.text(`เงินได้สุทธิ (Net Pay):`, 120, yPos + 50);
            doc.text(`${Number(data.net).toLocaleString()} บาท`, 190, yPos + 50, { align: "right" });
            
            // กรอบล่าง
            doc.setDrawColor(200);
            doc.rect(20, yPos + 60, 170, 30);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`โอนเข้าบัญชี: ${data.bank || '-'}`, 25, yPos + 70);
            doc.text(`หมายเหตุ: เอกสารนี้สร้างจากระบบอัตโนมัติ`, 25, yPos + 80);
            doc.setTextColor(0);
        });

        // บันทึกไฟล์
        const fileName = dataArray.length === 1 ? `Payslip_${dataArray[0].name}.pdf` : `Payslip_Batch_${new Date().getTime()}.pdf`;
        doc.save(fileName);
        return true;

    } catch (error) {
        console.error("Error generating Payslip:", error);
        alert("เกิดข้อผิดพลาดในการสร้าง PDF: " + error.message);
        return false;
    }
};

// ==========================================
// 2. ฟังก์ชันสร้างรายงานสรุปเงินเดือน (Salary Summary)
// ==========================================
export const generateSalarySummary = async (dataArray) => {
    try {
        const doc = initDoc();
        doc.setFontSize(18);
        doc.text("รายงานสรุปการจ่ายเงินเดือนพนักงาน", 105, 20, { align: "center" });
        doc.setFontSize(12);
        doc.text(`วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH')}`, 190, 30, { align: "right" });

        let y = 40;
        // Header
        doc.setFillColor(230, 230, 230);
        doc.rect(10, y, 190, 10, 'F');
        doc.setFontSize(10);
        doc.text("ชื่อ-นามสกุล", 12, y + 7);
        doc.text("ตำแหน่ง", 50, y + 7);
        doc.text("รายรับรวม", 110, y + 7, { align: "right" });
        doc.text("รายการหัก", 140, y + 7, { align: "right" });
        doc.text("สุทธิ", 170, y + 7, { align: "right" });
        doc.text("ลงชื่อ", 195, y + 7, { align: "right" });

        y += 10;
        
        // Loop Rows
        dataArray.forEach((row) => {
            // row format from index.html map: [period, month, year, emp_id, name, pos, salary, incentive, other, totalInc, totalDed, net]
            const name = row[4];
            const pos = row[5];
            const totalInc = row[9];
            const totalDed = row[10];
            const net = row[11];

            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            doc.text(name, 12, y + 7);
            doc.text(pos.substring(0, 15), 50, y + 7);
            doc.text(totalInc, 110, y + 7, { align: "right" });
            doc.text(totalDed, 140, y + 7, { align: "right" });
            doc.text(net, 170, y + 7, { align: "right" });
            doc.line(10, y + 10, 200, y + 10); // line bottom
            y += 10;
        });

        doc.save(`Salary_Summary_${new Date().getTime()}.pdf`);

    } catch (error) {
        console.error(error);
        alert("Error generating summary: " + error.message);
    }
};

// ==========================================
// 3. ฟังก์ชันสร้างใบสำคัญจ่าย (Receipt)
// ==========================================
export const generateReceipt = async (data) => {
    try {
        const doc = initDoc();
        doc.setFontSize(20);
        doc.text("ใบสำคัญจ่าย (Payment Voucher)", 105, 25, { align: "center" });
        
        doc.setFontSize(14);
        doc.rect(20, 35, 170, 40);
        doc.text(`เลขที่เอกสาร: ${data.id}`, 25, 45);
        doc.text(`วันที่: ${new Date(data.date).toLocaleDateString('th-TH')}`, 120, 45);
        doc.text(`จ่ายให้: ${data.empName}`, 25, 55);
        doc.text(`ชื่องาน: ${data.job_name}`, 25, 65);

        doc.setLineWidth(0.5);
        doc.line(20, 80, 190, 80);

        let y = 90;
        doc.text("รายการ", 25, y);
        doc.text("จำนวนเงิน (บาท)", 185, y, { align: "right" });
        y += 10;
        doc.line(20, y-5, 190, y-5);

        y += 10;
        doc.text("ค่าจ้างเหมารวม", 25, y);
        doc.text(Number(data.amount).toLocaleString(), 185, y, { align: "right" });
        
        y += 10;
        doc.text(`หักภาษี ณ ที่จ่าย (${data.wht_rate}%)`, 25, y);
        doc.text(Number(data.tax).toLocaleString(), 185, y, { align: "right" });

        y += 15;
        doc.line(20, y, 190, y);
        y += 10;
        doc.setFontSize(16);
        doc.text("ยอดจ่ายสุทธิ", 25, y);
        doc.text(Number(data.net).toLocaleString(), 185, y, { align: "right" });
        doc.line(20, y+5, 190, y+5);
        doc.line(20, y+6, 190, y+6); // Double line

        y += 40;
        doc.setFontSize(12);
        doc.text("....................................................", 50, y);
        doc.text("ผู้จ่ายเงิน", 65, y + 10);

        doc.text("....................................................", 140, y);
        doc.text("ผู้รับเงิน", 155, y + 10);

        doc.save(`Voucher_${data.id}.pdf`);

    } catch (error) {
        console.error(error);
        alert("Error generating receipt: " + error.message);
    }
};

// ==========================================
// 4. ฟังก์ชันสร้างรายงานเที่ยววิ่ง (Trip Report)
// ==========================================
export const generateTripReport = async (pdfData, type, monthLabel) => {
    try {
        const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
        addThaiFont(doc);
        doc.setFont(fontName, fontStyle);

        doc.setFontSize(18);
        doc.text(`รายงานสรุปจำนวนเที่ยวรายวัน (${type})`, 148, 20, { align: "center" });
        doc.setFontSize(14);
        doc.text(`ประจำเดือน: ${monthLabel}`, 148, 30, { align: "center" });

        let startX = 10;
        let startY = 40;
        let cellWidth = 13;
        let nameWidth = 50;
        
        // Header Row
        doc.setFontSize(10);
        doc.setFillColor(220, 220, 220);
        doc.rect(startX, startY, nameWidth, 10, 'F');
        doc.rect(startX, startY, nameWidth, 10); // border
        doc.text("ชื่อพนักงาน", startX + 2, startY + 6);

        for (let i = 1; i <= 15; i++) {
            let x = startX + nameWidth + ((i - 1) * cellWidth);
            doc.rect(x, startY, cellWidth, 10, 'F');
            doc.rect(x, startY, cellWidth, 10);
            doc.text(`${i}`, x + 4, startY + 6);
        }
        let totalX = startX + nameWidth + (15 * cellWidth);
        doc.rect(totalX, startY, 20, 10, 'F');
        doc.rect(totalX, startY, 20, 10);
        doc.text("รวม", totalX + 5, startY + 6);

        // Data Rows
        let y = startY + 10;
        pdfData.forEach(row => {
            const name = row[0];
            const total = row[row.length - 1];

            doc.rect(startX, y, nameWidth, 10);
            doc.text(name, startX + 2, y + 6);

            for (let i = 1; i <= 15; i++) {
                let x = startX + nameWidth + ((i - 1) * cellWidth);
                let val = row[i] || "-";
                doc.rect(x, y, cellWidth, 10);
                if(val === "หยุด") {
                     doc.setTextColor(200, 0, 0);
                     doc.text("x", x + 5, y + 6);
                     doc.setTextColor(0);
                } else {
                     doc.text(val.toString(), x + 4, y + 6);
                }
            }

            doc.rect(totalX, y, 20, 10);
            doc.text(total, totalX + 5, y + 6);

            y += 10;
            if (y > 180) {
                doc.addPage();
                y = 20; // Reset y for new page
            }
        });

        doc.save(`TripReport_${new Date().getTime()}.pdf`);

    } catch (error) {
        console.error(error);
        alert("Error generating trip report: " + error.message);
    }
};

// ==========================================
// 5. ฟังก์ชันสร้างรายงานบัญชี (Ledger)
// ==========================================
export const generateLedger = async (summary, list) => {
    try {
        const doc = initDoc();
        doc.setFontSize(18);
        doc.text("รายงานรายรับ-รายจ่าย (Ledger)", 105, 20, { align: "center" });
        doc.setFontSize(14);
        doc.text(summary.label, 105, 28, { align: "center" });

        // Summary Box
        doc.setDrawColor(0);
        doc.rect(20, 35, 170, 20);
        doc.setFontSize(12);
        doc.text(`รายรับรวม: ${summary.inc.toLocaleString()}`, 30, 48);
        doc.text(`รายจ่ายรวม: ${summary.exp.toLocaleString()}`, 90, 48);
        doc.text(`คงเหลือ: ${summary.net.toLocaleString()}`, 150, 48);

        // Table Header
        let y = 65;
        doc.setFillColor(220);
        doc.rect(20, y, 170, 10, 'F');
        doc.text("วันที่", 25, y + 7);
        doc.text("รายการ", 50, y + 7);
        doc.text("รับ", 140, y + 7, { align: "right" });
        doc.text("จ่าย", 180, y + 7, { align: "right" });
        
        y += 10;

        // Rows
        list.forEach(item => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text(item.date, 25, y + 7);
            doc.text(item.description.substring(0, 40), 50, y + 7);
            
            if(item.income > 0) {
                 doc.setTextColor(0, 128, 0);
                 doc.text(item.income.toLocaleString(), 140, y + 7, { align: "right" });
            } else {
                 doc.text("-", 140, y + 7, { align: "right" });
            }
            
            if(item.expense > 0) {
                 doc.setTextColor(255, 0, 0);
                 doc.text(item.expense.toLocaleString(), 180, y + 7, { align: "right" });
            } else {
                 doc.text("-", 180, y + 7, { align: "right" });
            }
            
            doc.setTextColor(0); // Reset color
            doc.line(20, y+10, 190, y+10); // bottom line
            y += 10;
        });

        doc.save(`Ledger_Report.pdf`);
    } catch (error) {
        console.error(error);
        alert("Error generating ledger: " + error.message);
    }
};

// ==========================================
// 6. ฟังก์ชันเดิมที่มีอยู่แล้ว (generateSalarySlipPDF - สำหรับสลิปเดี่ยวแบบโครงสร้างเดิม)
//    (สามารถเก็บไว้ หรือใช้ generatePayslip([data]) แทนก็ได้ แต่เพื่อความชัวร์จะคงไว้)
// ==========================================
export const generateSalarySlipPDF = async (data) => {
    // Wrapper เพื่อเรียกใช้ Logic ใหม่ที่รองรับภาษาไทยสมบูรณ์
    return generatePayslip([data]);
};

// Default export object (เผื่อกรณีต้องการใช้แบบ Default)
export default {
    generatePayslip,
    generateSalarySummary,
    generateReceipt,
    generateTripReport,
    generateLedger,
    generateSalarySlipPDF
};
