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
// 1. ฟังก์ชันสร้างสลิปเงินเดือน (1 หน้า 2 สลิป บน-ล่าง)
// ==========================================
export const generatePayslip = async (dataArray) => {
    try {
        const doc = initDoc();
        
        dataArray.forEach((data, index) => {
            // คำนวณตำแหน่ง: 
            // - ถ้า index เป็นเลขคู่ (0, 2, 4...) => อยู่ด้านบน (Offset = 0)
            // - ถ้า index เป็นเลขคี่ (1, 3, 5...) => อยู่ด้านล่าง (Offset = 148.5 มม. ครึ่ง A4)
            const isBottom = index % 2 !== 0;
            const yOffset = isBottom ? 148.5 : 0;

            // เพิ่มหน้าใหม่เมื่อเป็นรายการด้านบน (Top) และไม่ใช่คนแรกสุด
            if (index > 0 && !isBottom) {
                doc.addPage();
            }

            // ถ้าเป็นสลิปด้านล่าง ให้วาดเส้นปะตรงกลางสำหรับตัด
            if (isBottom) {
                doc.setLineDash([3, 3], 0); // เส้นปะ
                doc.setDrawColor(150);      // สีเทา
                doc.line(5, 148.5, 205, 148.5); // วาดเส้นตัดแบ่งครึ่ง
                doc.setLineDash([]);        // กลับมาเป็นเส้นทึบ
                doc.setDrawColor(0);        // สีดำ
            }

            // --- เริ่มวาดเนื้อหา (ทุกพิกัด Y จะบวกด้วย yOffset) ---
            doc.setFontSize(16);
            // --- ส่วนหัวเอกสาร ---
            doc.text("ใบแจ้งเงินเดือน / Salary Slip", 105, 20 + yOffset, { align: "center" });
            
            doc.setFontSize(12);
            doc.text(`ชื่อ-นามสกุล: ${data.name || '-'}`, 20, 35 + yOffset);
            doc.text(`ตำแหน่ง: ${data.pos || '-'}`, 20, 42 + yOffset);
            doc.text(`งวดที่: ${data.period || '-'} ประจำเดือน: ${data.month}/${data.year}`, 190, 35 + yOffset, { align: "right" });
            doc.text(`วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH')}`, 190, 42 + yOffset, { align: "right" });

            // --- เส้นคั่น ---
            doc.setLineWidth(0.5);
            doc.line(20, 48 + yOffset, 190, 48 + yOffset);

            // --- รายละเอียดเงินเดือน ---
            let yPos = 58 + yOffset;
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
            doc.line(10, y + 10, 200, y + 10);
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
        doc.line(20, y+6, 190, y+6);

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
        doc.rect(startX, startY, nameWidth, 10);
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
                y = 20;
            }
        });

        doc.save(`TripReport_${new Date().getTime()}.pdf`);

    } catch (error) {
        console.error(error);
        alert("Error generating trip report: " + error.message);
    }
};

// ==========================================
// 5. ฟังก์ชันสร้างรายงานบัญชี (Ledger) - (เวอร์ชันมีหมวดหมู่ + ตีเส้นตาราง)
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
        doc.rect(20, y, 170, 10);

        doc.setFontSize(10);
        doc.text("วันที่", 25, y + 7);
        doc.text("หมวดหมู่", 50, y + 7);
        doc.text("รายการ", 85, y + 7);
        doc.text("รับ", 160, y + 7, { align: "right" });
        doc.text("จ่าย", 185, y + 7, { align: "right" });

        doc.line(45, y, 45, y + 10);
        doc.line(80, y, 80, y + 10);
        doc.line(140, y, 140, y + 10);
        doc.line(165, y, 165, y + 10);

        y += 10;

        // Rows
        list.forEach(item => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            doc.rect(20, y, 170, 10);

            doc.line(45, y, 45, y + 10);
            doc.line(80, y, 80, y + 10);
            doc.line(140, y, 140, y + 10);
            doc.line(165, y, 165, y + 10);

            doc.text(item.date, 25, y + 7);
            doc.text(item.category || "-", 50, y + 7);
            doc.text(item.description.substring(0, 35), 85, y + 7);
            
            if(item.income > 0) {
                 doc.setTextColor(0, 128, 0);
                 doc.text(item.income.toLocaleString(), 160, y + 7, { align: "right" });
            } else {
                 doc.text("-", 160, y + 7, { align: "right" });
            }
            
            if(item.expense > 0) {
                 doc.setTextColor(255, 0, 0);
                 doc.text(item.expense.toLocaleString(), 185, y + 7, { align: "right" });
            } else {
                 doc.text("-", 185, y + 7, { align: "right" });
            }
            
            doc.setTextColor(0);
            y += 10;
        });

        doc.save(`Ledger_Report.pdf`);
    } catch (error) {
        console.error(error);
        alert("Error generating ledger: " + error.message);
    }
};

// ==========================================
// 6. ฟังก์ชันเดิมที่มีอยู่แล้ว
// ==========================================
export const generateSalarySlipPDF = async (data) => {
    return generatePayslip([data]);
};

// Default export object
export default {
    generatePayslip,
    generateSalarySummary,
    generateReceipt,
    generateTripReport,
    generateLedger,
    generateSalarySlipPDF
};
