const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');

// ดึงค่า URL และ Key จาก Environment Variables ของ Netlify
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// ฟังก์ชันหลัก
const handler = async function(event, context) {
  console.log("⏰ กำลังรันฟังก์ชัน Keep-Awake เพื่อปลุก Supabase...");

  // เช็คว่ามีการตั้งค่า URL และ Key หรือยัง
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ไม่พบ SUPABASE_URL หรือ SUPABASE_ANON_KEY ในตั้งค่าของ Netlify");
    return { statusCode: 500, body: "Missing Supabase credentials" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // ⚠️ สำคัญมาก: เปลี่ยนคำว่า 'your_table_name' เป็นชื่อตารางที่มีอยู่จริงในฐานข้อมูลของคุณ
    // เช่น ถ้าคุณมีตารางชื่อ users ก็ให้เปลี่ยนเป็น .from('users')
    const { data, error } = await supabase
      .from('settings') 
      .select('*')
      .limit(1);
      
    // ถึงแม้จะใส่ชื่อตารางผิด หรือมี Error การที่ Netlify ยิงมาระบบ Supabase ก็ถือว่าถูกปลุกแล้ว
    if (error) {
      console.warn("⚠️ พบข้อความแจ้งเตือนจาก Supabase (แต่ระบบตื่นแล้ว):", error.message);
    } else {
      console.log("✅ ปลุก Supabase สำเร็จเรียบร้อย!");
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Supabase is awake!" })
    };
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// ตั้งเวลา: "0 17 */3 * *"
// ความหมาย: นาทีที่ 0, ชั่วโมงที่ 17 (เวลา UTC ซึ่งตรงกับ เที่ยงคืน เวลาไทย), ทุกๆ 3 วัน
exports.handler = schedule("0 17 */3 * *", handler);
