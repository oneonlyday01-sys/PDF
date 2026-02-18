// ==========================================
// File: src/services/PDFService.js
// ==========================================
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addThaiFont } from '../fonts/SarabunNew.js';

const PDFService = {
    
    // 1. รายงานสรุปจำนวนเที่ยวรายวัน
    generateTripReport: (data, reportType = 'ALL', monthLabel = '') => {
        const doc = new jsPDF('l', 'mm', 'a4');
        addThaiFont(doc);
        doc.setFont("THSarabunNew", "normal");

        let titleText = "สรุปจำนวนเที่ยวรายวัน (เฉพาะ แม็คโคร/สิบล้อ)";
        if (reportType === 'MACRO') titleText = "สรุปจำนวนเที่ยวรายวัน (เฉพาะ แม็คโคร)";
        else if (reportType === 'TRUCK') titleText = "สรุปจำนวนเที่ยวรายวัน (เฉพาะ สิบล้อ)";

        doc.setFontSize(18);
        doc.text(titleText, 148, 15, { align: "center" });
        
        doc.setFontSize(14);
        doc.text(`ประจำเดือน ${monthLabel}`, 148, 22, { align: "center" });

        doc.autoTable({
            startY: 30,
            head: [['ชื่อพนักงาน', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', 'รวม']],
            body: data, 
            theme: 'grid',
            styles: { font: 'THSarabunNew', fontSize: 10, cellPadding: 1, lineColor: [200, 200, 200] },
            headStyles: { 
                fillColor: [235, 245, 255], 
                textColor: [40, 40, 40],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.1
            },
            columnStyles: { 
                0: { halign: 'left', cellWidth: 40 }
            },
            didParseCell: (data) => {
                if (data.cell.raw === 'หยุด') {
                    data.cell.styles.textColor = [220, 53, 69];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        const fileName = reportType === 'ALL' ? 'Trip_Report_All.pdf' : `Trip_Report_${reportType}.pdf`;
        doc.save(fileName);
    },

    // 2. รายงานสรุปการจ่ายเงินเดือน (ตารางรวม)
    generateSalarySummary: (data) => {
        const doc = new jsPDF('l', 'mm', 'a4');
        addThaiFont(doc);
        doc.setFont("THSarabunNew", "normal");

        doc.setFontSize(18);
        doc.text("บริษัท N.O.K. จำกัด", 148, 10, { align: "center" });
        doc.setFontSize(14);
        doc.text("รายงานสรุปการจ่ายเงินเดือน", 148, 18, { align: "center" });

        doc.autoTable({
            startY: 25,
            head: [['งวด', 'ด.', 'ปี', 'รหัส', 'ชื่อ-สกุล', 'ตำแหน่ง', 'เงินเดือน', 'ค่าตอบแทน', 'อื่นๆ', 'รวมรับ', 'รวมหัก', 'สุทธิ']],
            body: data,
            styles: { font: 'THSarabunNew', fontSize: 10, cellPadding: 1.5 },
            headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
            columnStyles: {
                4: { cellWidth: 35 },
                11: { fontStyle: 'bold', halign: 'right' }
            }
        });
        
        doc.save("Salary_Summary.pdf");
    },

    // 3. ใบรับเงิน/ใบสำคัญรับเงิน
    generateReceipt: (info) => {
        const doc = new jsPDF('p', 'mm', 'a4');
        addThaiFont(doc);
        doc.setFont("THSarabunNew", "normal");

        doc.setFontSize(22);
        doc.text("ใบรับเงิน", 105, 20, { align: "center" });
        
        doc.setFontSize(14);
        doc.text("บริษัท N.O.K. จำกัด", 105, 28, { align: "center" });

        doc.setFontSize(12);
        const startInfoY = 40;
        doc.text(`เลขที่เอกสาร: ${info.id || '-'}`, 190, startInfoY, { align: 'right' });
        doc.text(`วันที่: ${info.date}`, 190, startInfoY + 7, { align: 'right' });

        doc.text(`ข้าพเจ้า: ${info.empName}`, 20, startInfoY + 7);
        doc.text(`ได้รับเงินจาก: บริษัท N.O.K. จำกัด`, 20, startInfoY + 14);
        doc.text(`รายละเอียดงาน: ${info.job_name || '-'}`, 20, startInfoY + 21);

        doc.autoTable({
            startY: startInfoY + 30,
            head: [['ลำดับ', 'รายละเอียด', 'จำนวนเงิน']],
            body: [
                [1, info.job_name, info.amount.toLocaleString()]
            ],
            foot: [['', 'หัก ณ ที่จ่าย (' + info.wht_rate + '%)', info.tax.toLocaleString()], ['', 'รวมเงินสุทธิ', info.net.toLocaleString()]],
            theme: 'grid',
            styles: { font: 'THSarabunNew', fontSize: 12 },
            columnStyles: {
                0: { halign: 'center', cellWidth: 20 },
                2: { halign: 'right', cellWidth: 40 }
            },
            footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'right' }
        });
        
        const signY = doc.lastAutoTable.finalY + 40;
        doc.text("(ลงชื่อ).......................................ผู้รับเงิน", 40, signY, { align: 'center' });
        doc.text(`( ${info.empName} )`, 40, signY + 7, { align: 'center' });

        doc.text("(ลงชื่อ).......................................ผู้จ่ายเงิน", 160, signY, { align: 'center' });
        doc.text("( ....................................... )", 160, signY + 7, { align: 'center' });

        doc.save(`Receipt_${info.id}.pdf`);
    },

    // 4. ใบแจ้งเงินเดือน (2 คนต่อ 1 หน้า A4)
    generatePayslip: (employees) => {
        const doc = new jsPDF('p', 'mm', 'a4');
        addThaiFont(doc);
        doc.setFont("THSarabunNew", "normal");

        const pageHeight = 297;
        const halfHeight = pageHeight / 2;
        
        const drawSingleSlip = (emp, startY) => {
            if (!emp) return;

            doc.setFontSize(16);
            doc.text("บริษัท N.O.K. จำกัด", 20, startY + 15);
            doc.text("ใบแจ้งเงินเดือน / PAYSLIP", 190, startY + 15, { align: "right" });

            doc.setFontSize(12);
            doc.text(`ชื่อ-สกุล: ${emp.name}`, 20, startY + 25);
            doc.text(`ตำแหน่ง: ${emp.pos}`, 20, startY + 32);
            doc.text(`งวดวันที่: ${emp.period}  เดือน: ${emp.month}/${emp.year}`, 190, startY + 25, { align: "right" });

            const income = emp.salary + emp.incentive + emp.other;
            const deduct = emp.sso + emp.tax + emp.advance + emp.water + emp.electricity;

            doc.autoTable({
                startY: startY + 40,
                head: [['รายการได้ (Income)', 'จำนวนเงิน', 'รายการหัก (Deduction)', 'จำนวนเงิน']],
                body: [
                    ['เงินเดือน', emp.salary.toLocaleString(), 'ประกันสังคม', emp.sso.toLocaleString()],
                    ['ค่าล่วงเวลา/เบี้ยเลี้ยง', emp.incentive.toLocaleString(), 'ภาษี', emp.tax.toLocaleString()],
                    ['อื่นๆ', emp.other.toLocaleString(), 'เบิกล่วงหน้า', emp.advance.toLocaleString()],
                    ['', '', 'ค่าน้ำ/ไฟ', (emp.water + emp.electricity).toLocaleString()],
                    ['รวมรายได้', income.toLocaleString(), 'รวมรายการหัก', deduct.toLocaleString()]
                ],
                theme: 'plain',
                styles: { font: 'THSarabunNew', fontSize: 11, cellPadding: 1.5 },
                headStyles: { fillColor: [220, 220, 220], textColor: [0,0,0], fontStyle: 'bold' },
                columnStyles: {
                    1: { halign: 'right' },
                    3: { halign: 'right' }
                }
            });

            const finalY = doc.lastAutoTable.finalY + 5;
            doc.setFillColor(240, 240, 240);
            doc.rect(120, finalY, 70, 15, 'F');
            
            doc.setFontSize(14);
            doc.setFont("THSarabunNew", "bold");
            doc.text("เงินได้สุทธิ (NET PAY)", 125, finalY + 10);
            doc.text(`${emp.net.toLocaleString()} บาท`, 185, finalY + 10, { align: "right" });
            
            doc.setFont("THSarabunNew", "normal");
        };

        for (let i = 0; i < employees.length; i += 2) {
            if (i > 0) doc.addPage();

            drawSingleSlip(employees[i], 0);

            doc.setLineDash([2, 2], 0);
            doc.line(10, halfHeight, 200, halfHeight);
            doc.setLineDash([]);

            if (employees[i + 1]) {
                drawSingleSlip(employees[i + 1], halfHeight);
            }
        }

        doc.save("Payslips_Combined.pdf");
    },

    // 5. สรุปรายรับ-รายจ่าย
    generateLedger: (summary, transactions) => {
        const doc = new jsPDF('l', 'mm', 'a4');
        addThaiFont(doc);
        doc.setFont("THSarabunNew", "bold");

        doc.setFontSize(20);
        doc.text("สรุปรายรับ-รายจ่าย", 148, 15, { align: "center" });
        doc.setFontSize(14);
        doc.text(summary.label || '', 148, 22, { align: "center" });

        const drawCard = (label, value, x, color) => {
            doc.setFillColor(color[0], color[1], color[2]);
            doc.rect(x, 30, 50, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.text(label, x + 5, 37);
            doc.setFontSize(16);
            doc.text(value.toLocaleString(), x + 45, 45, { align: 'right' });
        };

        drawCard("รายรับรวม", summary.inc, 40, [40, 167, 69]);
        drawCard("รายจ่ายรวม", summary.exp, 120, [220, 53, 69]);
        drawCard("คงเหลือ", summary.net, 200, [0, 123, 255]);

        doc.setTextColor(0, 0, 0);

        const bodyData = transactions.map(t => [
            t.date,
            t.description,
            t.category || '-',
            t.income > 0 ? t.income.toLocaleString() : '-',
            t.expense > 0 ? t.expense.toLocaleString() : '-'
        ]);

        doc.autoTable({
            startY: 60,
            head: [['วันที่', 'รายการ', 'หมวดหมู่', 'รายรับ', 'รายจ่าย']],
            body: bodyData,
            theme: 'striped',
            styles: { font: 'THSarabunNew', fontSize: 10 },
            headStyles: { fillColor: [52, 58, 64], halign: 'center' },
            columnStyles: {
                3: { textColor: [40, 167, 69], halign: 'right' },
                4: { textColor: [220, 53, 69], halign: 'right' }
            }
        });
        
        doc.save("Ledger_Report.pdf");
    }
};

export default PDFService;

