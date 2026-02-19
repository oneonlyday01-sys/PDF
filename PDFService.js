// ==========================================
// File: PDFService.js
// ==========================================

// 1. นำเข้าฟอนต์จากไฟล์
import { thSarabunNewBase64, fontName, fontStyle, addThaiFont } from './src/fonts/SarabunNew.js';

// 2. ดึง jsPDF มาจากหน้าเว็บ
const { jsPDF } = window.jspdf;

// Helper: ตั้งค่าเริ่มต้นและฟอนต์
const initDoc = (orientation = 'p') => {
    const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
    });
    addThaiFont(doc);
    doc.setFont(fontName, fontStyle);
    return doc;
};

// Helper: ฟังก์ชันแปลงตัวเลขเป็นคำอ่านภาษาไทย (บาท)
const bahtText = (num) => {
    if (!num && num !== 0) return "";
    num = parseFloat(num).toFixed(2);
    const suffixes = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
    const digits = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
    let parts = num.split(".");
    let baht = parts[0];
    let satang = parts[1];
    let result = "";
    let len = baht.length;

    for (let i = 0; i < len; i++) {
        let digit = parseInt(baht.charAt(i));
        let pos = len - i - 1;
        if (digit !== 0) {
            if (pos % 6 === 1 && digit === 1 && len > 1) result += "";
            else if (pos % 6 === 1 && digit === 2) result += "ยี่";
            else if (pos % 6 === 0 && digit === 1 && i > 0 && len > 1) result += "เอ็ด";
            else result += digits[digit];
            result += suffixes[pos % 6];
        }
        if (pos % 6 === 0 && pos > 0) result += "ล้าน";
    }
    result += "บาท";
    if (Number(satang) === 0) result += "ถ้วน";
    else {
        for (let i = 0; i < 2; i++) {
            let digit = parseInt(satang.charAt(i));
            let pos = 1 - i;
            if (digit !== 0) {
                if (pos === 1 && digit === 1) result += "";
                else if (pos === 1 && digit === 2) result += "ยี่";
                else if (pos === 0 && digit === 1 && i > 0) result += "เอ็ด";
                else result += digits[digit];
                result += (pos === 1 ? "สิบ" : "");
            }
        }
        result += "สตางค์";
    }
    return result;
};

// ==========================================
// 1. ฟังก์ชันสร้างสลิปเงินเดือน (1 หน้า A4 มี 2 สลิป บน-ล่าง + เส้นปะ + ลบข้อมูลด้านล่างออกหมด)
// ==========================================
export const generatePayslip = async (dataArray) => {
    try {
        const doc = initDoc('p');
        
        dataArray.forEach((data, index) => {
            const isBottom = index % 2 !== 0; // คี่อยู่ล่าง, คู่อยู่บน
            const yOffset = isBottom ? 148.5 : 0;

            // ขึ้นหน้าใหม่เมื่อเป็นคนใหม่ที่อยู่ด้านบน
            if (index > 0 && !isBottom) {
                doc.addPage();
            }

            // วาดเส้นปะแบ่งครึ่งหน้ากระดาษ (เฉพาะตอนวาดสลิปล่าง)
            if (isBottom) {
                doc.setLineDash([3, 3], 0);
                doc.setDrawColor(150, 150, 150);
                doc.line(10, 148.5, 200, 148.5);
                doc.setLineDash([]); // รีเซ็ตเส้นทึบ
                doc.setDrawColor(0, 0, 0); // รีเซ็ตสีดำ
            }

            // --- หัวสลิป ---
            doc.setFontSize(16);
            doc.text("ใบแจ้งเงินเดือน / Salary Slip", 105, 20 + yOffset, { align: "center" });
            
            doc.setFontSize(12);
            doc.text(`ชื่อ-นามสกุล: ${data.name || '-'}`, 20, 35 + yOffset);
            doc.text(`ตำแหน่ง: ${data.pos || '-'}`, 20, 42 + yOffset);
            doc.text(`งวดที่: ${data.period || '-'} ประจำเดือน: ${data.month}/${data.year}`, 190, 35 + yOffset, { align: "right" });
            doc.text(`วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH')}`, 190, 42 + yOffset, { align: "right" });

            doc.setLineWidth(0.5);
            doc.line(20, 48 + yOffset, 190, 48 + yOffset);

            // --- ส่วนรายรับ-รายจ่าย ---
            let yPos = 58 + yOffset;
            doc.setFontSize(14);
            doc.text("รายการรับ (Income)", 20, yPos);
            doc.text("รายการหัก (Deduction)", 110, yPos);
            
            doc.setFontSize(12);
            yPos += 10;
            
            // คอลัมน์ซ้าย (รายรับ)
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

            // คอลัมน์ขวา (รายหัก)
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

            // --- ส่วนสรุปยอดสุทธิ ---
            doc.line(20, yPos + 38, 190, yPos + 38);
            doc.setFontSize(16);
            doc.text(`เงินได้สุทธิ (Net Pay):`, 120, yPos + 50);
            doc.text(`${Number(data.net).toLocaleString()} บาท`, 190, yPos + 50, { align: "right" });
            
            // ลบกรอบสี่เหลี่ยมและตัวหนังสือด้านล่างออกทั้งหมด ตามที่ขอ
        });

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
// 2. ฟังก์ชันสร้างรายงานสรุปเงินเดือน (ตารางละเอียดแยกสีตามกลุ่ม และพื้นหลังข้อมูลสีขาว)
// ==========================================
export const generateSalarySummary = async (dataArray) => {
    try {
        const doc = initDoc('l'); // ใช้กระดาษแนวนอน
        
        doc.setFontSize(16);
        doc.text("รายงานสรุปการจ่ายเงินเดือนพนักงาน", 148.5, 15, { align: "center" });
        doc.setFontSize(12);
        
        const companyName = "รายงานจากระบบอัตโนมัติ"; 
        const monthYearLabel = dataArray.length > 0 ? `ประจำเดือน ${dataArray[0][1] || ''}/${dataArray[0][2] || ''}` : "";
        doc.text(companyName, 148.5, 22, { align: "center" });
        doc.text(monthYearLabel, 148.5, 29, { align: "center" });

        let startX = 10;
        let y = 35;
        const colW = [10, 12, 12, 20, 35, 25, 18, 18, 18, 20, 12, 15, 12, 12, 20, 20];
        const headers = ["งวดที่", "เดือน", "ปี", "เลขบัตร/รหัส", "ชื่อ-สกุล", "ตำแหน่ง", "เงินเดือน", "ค่าตอบแทน", "อื่นๆ", "รวมรับ", "สปส.", "เบิก", "น้ำ", "ไฟ", "รวมหัก", "สุทธิ"];
        
        doc.setFontSize(10);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.1);
        
        let currentX = startX;
        
        // วาดหัวตารางแบ่งตามสีที่ระบุ
        for(let i=0; i<16; i++) {
            if(i >= 0 && i <= 2) doc.setFillColor(200, 220, 255); // ฟ้าอ่อน (งวด/เดือน/ปี)
            else if(i >= 3 && i <= 5) doc.setFillColor(255, 250, 200); // เหลืองอ่อน (ข้อมูลพนักงาน)
            else if(i >= 6 && i <= 9) doc.setFillColor(220, 255, 220); // เขียวอ่อน (รายรับ)
            else if(i >= 10 && i <= 14) doc.setFillColor(255, 220, 220); // ชมพูอ่อน/แดงอ่อน (รายหัก)
            else if(i === 15) doc.setFillColor(230, 230, 240); // เทาฟ้า (สุทธิ)

            doc.rect(currentX, y, colW[i], 10, 'FD'); // วาดกรอบพร้อมเติมสี
            doc.text(headers[i], currentX + colW[i]/2, y + 6, { align: "center" });
            currentX += colW[i];
        }

        y += 10;

        // วาดข้อมูล
        dataArray.forEach(row => {
            if (y > 190) { 
                doc.addPage();
                y = 20;
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.1);
            }

            currentX = startX;

            for (let i = 0; i < 16; i++) {
                let textVal = row[i];
                if (textVal == null) textVal = "-";

                // แปลงตัวเลขใส่คอมม่าถ้าเป็นคอลัมน์เงิน
                if (i >= 6 && i <= 15) {
                    let num = parseFloat(String(textVal).replace(/,/g, ''));
                    if (isNaN(num)) num = 0;
                    textVal = num.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0});
                }

                doc.rect(currentX, y, colW[i], 8, 'S');
                
                if (i >= 6) {
                    doc.text(String(textVal), currentX + colW[i] - 2, y + 5.5, { align: "right" });
                } else {
                    let align = (i <= 3) ? "center" : "left";
                    let xText = (i <= 3) ? currentX + colW[i]/2 : currentX + 2;
                    doc.text(String(textVal), xText, y + 5.5, { align: align });
                }
                currentX += colW[i];
            }
            y += 8;
        });

        doc.save(`Salary_Summary_Detailed_${new Date().getTime()}.pdf`);
    } catch (error) {
        console.error(error);
        alert("Error generating summary: " + error.message);
    }
};

// ==========================================
// 3. ฟังก์ชันสร้างใบเสร็จรับเงิน (แบบใหม่ ดึง 6 ข้อมูล เรียงบรรทัดลงมา)
// ==========================================
export const generateReceipt = async (data) => {
    try {
        const doc = initDoc('p');
        
        doc.setFontSize(22);
        doc.text("ใบเสร็จรับเงิน", 105, 25, { align: "center" });
        
        doc.setFontSize(14);
        doc.text(`วันที่    ${new Date(data.date).toLocaleDateString('th-TH')}`, 180, 40, { align: "right" });

        const startY = 50;
        const lineH = 9;
        
        // 1. ดึงข้อมูล 6 อย่างตามที่กำหนด (ถ้าไม่มีจะเป็นช่องว่าง)
        const empName = data.empName || "";
        const empAddr = data.empAddress || "";
        const empCardId = data.empCardId || "";
        const companyName = data.companyName || "";
        const companyAddr = data.companyAddress || "";
        const companyTaxId = data.companyTaxId || "";

        // --- เริ่มจัด Layout ตามบรรทัด ---
        // บรรทัด 1: ชื่อพนักงาน
        doc.text("ข้าพเจ้า", 25, startY);
        doc.text(empName, 45, startY);
        
        // บรรทัด 2: ที่อยู่พนักงาน (จัดวางยาวๆ ด้านซ้ายบรรทัดเดียว)
        doc.text("ที่อยู่", 25, startY + lineH);
        doc.text(empAddr, 40, startY + lineH); 
        
        // บรรทัด 3: เลขบัตรประชาชน
        doc.text("เลขประจำตัวบัตรประชาชน", 25, startY + (lineH * 2));
        doc.text(empCardId, 75, startY + (lineH * 2));

        // บรรทัด 4: ได้รับเงินจากบริษัท (ชื่อบริษัท)
        doc.text("ได้รับเงินจาก บริษัท", 25, startY + (lineH * 3));
        doc.text(companyName, 65, startY + (lineH * 3));
        
        // บรรทัด 5: ที่อยู่บริษัท
        doc.text("ที่อยู่บริษัท", 25, startY + (lineH * 4));
        doc.text(companyAddr, 50, startY + (lineH * 4));

        // บรรทัด 6: เลขประจำตัวผู้เสียภาษี
        doc.text("เลขประจำตัวผู้เสียภาษี", 25, startY + (lineH * 5));
        doc.text(companyTaxId, 70, startY + (lineH * 5));

        // --- ตารางรายการ ---
        const tableY = startY + (lineH * 6) + 5;
        const col1X = 25;
        const col2X = 145;
        const colWidth = 160;
        const rowHeight = 8;

        doc.setDrawColor(0, 0, 0);
        doc.rect(col1X, tableY, colWidth, rowHeight);
        doc.line(col2X, tableY, col2X, tableY + rowHeight);
        doc.text("รายละเอียด", (col1X + col2X) / 2, tableY + 5.5, { align: "center" });
        doc.text("จำนวนเงิน", (col2X + col1X + colWidth) / 2, tableY + 5.5, { align: "center" });

        let currentY = tableY + rowHeight;
        for(let i=0; i<4; i++) {
            doc.rect(col1X, currentY, colWidth, rowHeight);
            doc.line(col2X, currentY, col2X, currentY + rowHeight);
            if(i === 0) {
                 doc.text(data.job_name || "-", col1X + 2, currentY + 5.5);
                 doc.text(Number(data.amount).toLocaleString(undefined, {minimumFractionDigits:2}), 182, currentY + 5.5, { align: "right" });
            }
            currentY += rowHeight;
        }

        const totalLabelX = 135;
        const totalValX = 182;
        
        doc.text("ยอดเงิน", totalLabelX, currentY + 7, { align: "right" });
        doc.text(Number(data.amount).toLocaleString(undefined, {minimumFractionDigits:2}), totalValX, currentY + 7, { align: "right" });

        doc.text(`หักภาษี ณ ที่จ่าย ${data.wht_rate}%`, totalLabelX, currentY + 14, { align: "right" });
        doc.text(Number(data.tax).toLocaleString(undefined, {minimumFractionDigits:2}), totalValX, currentY + 14, { align: "right" });

        doc.text("รวมเงินทั้งสิ้น", totalLabelX, currentY + 21, { align: "right" });
        doc.text(Number(data.net).toLocaleString(undefined, {minimumFractionDigits:2}), totalValX, currentY + 21, { align: "right" });

        const bahtY = currentY + 21;
        doc.text("จำนวนเงิน", 25, bahtY);
        doc.text(`--(${bahtText(data.net)})--`, 50, bahtY);

        // --- ช่องติ๊กเลือกการจ่ายเงิน ---
        const checkY = bahtY + 15;
        doc.text("(   ) เงินสด", 30, checkY);
        doc.text("(   ) โอนธนาคาร", 70, checkY);
        doc.text("เลขบัญชี ...............................................", 110, checkY);
        doc.text("วันที่ .............................", 165, checkY);

        // --- ลายเซ็น ---
        const signY = checkY + 25;
        doc.text("ข้าพเจ้าได้รับเงินเรียบร้อยแล้ว", 105, signY, { align: "center" });

        const signRow1 = signY + 15;
        doc.text("ลงชื่อ......................................................ผู้รับเงิน", 130, signRow1, { align: "center" });
        doc.text("(......................................................)", 130, signRow1 + 7, { align: "center" });

        const signRow2 = signRow1 + 25;
        doc.text("ลงชื่อ......................................................ผู้จ่ายเงิน", 130, signRow2, { align: "center" });
        doc.text("(......................................................)", 130, signRow2 + 7, { align: "center" });

        doc.save(`Receipt_${data.id}.pdf`);
    } catch (error) {
        console.error(error);
        alert("Error generating receipt: " + error.message);
    }
};

// ==========================================
// 4. ฟังก์ชันสร้างรายงานเที่ยววิ่ง (หัวสีส้ม/เขียว/ฟ้า, พื้นหลังข้อมูลขาว, หยุดสีแดง)
// ==========================================
export const generateTripReport = async (pdfData, type, monthLabel) => {
    try {
        const doc = initDoc('l');

        doc.setFontSize(18);
        doc.text(`รายงานสรุปจำนวนเที่ยวรายวัน (${type})`, 148.5, 20, { align: "center" });
        doc.setFontSize(14);
        doc.text(`ประจำเดือน: ${monthLabel}`, 148.5, 30, { align: "center" });

        let startX = 10;
        let startY = 40;
        let cellWidth = 13;
        let nameWidth = 50;
        let totalW = 20;
        
        doc.setFontSize(10);
        doc.setLineWidth(0.1);
        doc.setDrawColor(0, 0, 0);

        // --- หัวตาราง (ลงสีตามโซนที่ระบุ) ---
        // 1. ชื่อพนักงาน (สีส้มอ่อน)
        doc.setFillColor(255, 220, 180); 
        doc.rect(startX, startY, nameWidth, 10, 'FD');
        doc.text("ชื่อพนักงาน", startX + nameWidth/2, startY + 6.5, { align: "center" });

        // 2. วันที่ 1-15 (สีเขียวอ่อน)
        doc.setFillColor(200, 240, 200);
        for (let i = 1; i <= 15; i++) {
            let x = startX + nameWidth + ((i - 1) * cellWidth);
            doc.rect(x, startY, cellWidth, 10, 'FD');
            doc.text(`${i}`, x + cellWidth/2, startY + 6.5, { align: "center" });
        }
        
        // 3. รวม (สีฟ้า)
        let totalX = startX + nameWidth + (15 * cellWidth);
        doc.setFillColor(180, 220, 255);
        doc.rect(totalX, startY, totalW, 10, 'FD');
        doc.text("รวม", totalX + totalW/2, startY + 6.5, { align: "center" });

        // --- ข้อมูลตาราง ---
        let y = startY + 10;
        
        pdfData.forEach(row => {
            if (y > 180) {
                doc.addPage();
                y = 20;
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.1);
            }

            const name = row[0];
            const total = row[row.length - 1];

            // ชื่อ
            doc.rect(startX, y, nameWidth, 10, 'S');
            doc.text(name, startX + 2, y + 6.5);

            // วันที่ 1-15
            for (let i = 1; i <= 15; i++) {
                let x = startX + nameWidth + ((i - 1) * cellWidth);
                let val = row[i] || "-";
                
                doc.rect(x, y, cellWidth, 10, 'S');
                
                if(String(val).includes("หยุด")) {
                     doc.setTextColor(255, 0, 0); // คำว่าหยุด สีแดง
                     doc.text("หยุด", x + cellWidth/2, y + 6.5, { align: "center" });
                     doc.setTextColor(0, 0, 0); // รีเซ็ตเป็นสีดำ
                } else {
                     doc.text(String(val), x + cellWidth/2, y + 6.5, { align: "center" }); // ตัวเลขสีดำ
                }
            }

            // รวม
            doc.rect(totalX, y, totalW, 10, 'S');
            doc.text(String(total), totalX + totalW/2, y + 6.5, { align: "center" });

            y += 10;
        });

        doc.save(`TripReport_${new Date().getTime()}.pdf`);
    } catch (error) {
        console.error(error);
        alert("Error generating trip report: " + error.message);
    }
};

// ==========================================
// 5. ฟังก์ชันสร้างรายงานบัญชี (Ledger) - แก้สีหัวตารางเทาอ่อน พื้นหลังเนื้อหาสีขาว
// ==========================================
export const generateLedger = async (summary, list) => {
    try {
        const doc = initDoc('p');
        doc.setFontSize(18);
        doc.text("รายงานรายรับ-รายจ่าย (Ledger)", 105, 20, { align: "center" });
        doc.setFontSize(14);
        doc.text(summary.label, 105, 28, { align: "center" });

        doc.setDrawColor(0, 0, 0);
        doc.rect(20, 35, 170, 20, 'S');
        doc.setFontSize(12);
        doc.text(`รายรับรวม: ${summary.inc.toLocaleString()}`, 30, 48);
        doc.text(`รายจ่ายรวม: ${summary.exp.toLocaleString()}`, 90, 48);
        doc.text(`คงเหลือ: ${summary.net.toLocaleString()}`, 150, 48);

        // --- หัวตาราง ---
        let y = 65;
        const colW = [25, 35, 60, 25, 25];
        const headers = ["วันที่", "หมวดหมู่", "รายการ", "รับ", "จ่าย"];
        
        doc.setFillColor(230, 230, 230); // สีเทาอ่อน (ให้อ่านตัวหนังสือออก)
        doc.setLineWidth(0.1);
        doc.setTextColor(0, 0, 0); // ตัวหนังสือดำ
        
        let currentX = 20;
        for(let i=0; i<5; i++) {
            doc.rect(currentX, y, colW[i], 10, 'FD');
            let align = i >= 3 ? "right" : "center";
            let xText = i >= 3 ? currentX + colW[i] - 5 : currentX + colW[i]/2;
            doc.text(headers[i], xText, y + 7, { align: align });
            currentX += colW[i];
        }

        y += 10;

        // --- ข้อมูลตาราง ---
        list.forEach(item => {
            if (y > 270) {
                doc.addPage();
                y = 20;
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.1);
            }

            currentX = 20;

            // วันที่
            doc.rect(currentX, y, colW[0], 10, 'S');
            doc.text(item.date, currentX + colW[0]/2, y + 7, { align: "center" });
            currentX += colW[0];

            // หมวดหมู่
            doc.rect(currentX, y, colW[1], 10, 'S');
            doc.text(item.category || "-", currentX + colW[1]/2, y + 7, { align: "center" });
            currentX += colW[1];

            // รายการ
            doc.rect(currentX, y, colW[2], 10, 'S');
            doc.text(item.description.substring(0, 30), currentX + 2, y + 7);
            currentX += colW[2];

            // รับ (ตัวเลขสีเขียว)
            doc.rect(currentX, y, colW[3], 10, 'S');
            if(item.income > 0) {
                doc.setTextColor(0, 128, 0);
                doc.text(item.income.toLocaleString(), currentX + colW[3] - 2, y + 7, { align: "right" });
            } else {
                doc.text("-", currentX + colW[3] - 2, y + 7, { align: "right" });
            }
            doc.setTextColor(0, 0, 0);
            currentX += colW[3];

            // จ่าย (ตัวเลขสีแดง)
            doc.rect(currentX, y, colW[4], 10, 'S');
            if(item.expense > 0) {
                doc.setTextColor(255, 0, 0);
                doc.text(item.expense.toLocaleString(), currentX + colW[4] - 2, y + 7, { align: "right" });
            } else {
                doc.text("-", currentX + colW[4] - 2, y + 7, { align: "right" });
            }
            doc.setTextColor(0, 0, 0);
            
            y += 10;
        });

        doc.save(`Ledger_Report.pdf`);
    } catch (error) {
        console.error(error);
        alert("Error generating ledger: " + error.message);
    }
};

export const generateSalarySlipPDF = async (data) => {
    return generatePayslip([data]);
};

export default {
    generatePayslip,
    generateSalarySummary,
    generateReceipt,
    generateTripReport,
    generateLedger,
    generateSalarySlipPDF
};
