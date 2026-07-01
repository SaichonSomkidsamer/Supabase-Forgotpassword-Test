// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    // หา Form หรือ ปุ่ม จากหน้า index.html
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // กันหน้าเว็บรีเฟรช

            // ตรวจสอบชัวร์ๆ ว่าตัวแปร supabase จาก config.js พร้อมใช้งาน
            if (!supabase) {
                alert("ระบบฐานข้อมูลยังไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง");
                return;
            }

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // เรียกใช้ฟังก์ชันล็อกอินของ Supabase Auth
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error;

                // ล็อกอินผ่าน Supabase Auth สำเร็จ -> เช็กสิทธิ์แอดมินในตาราง admin_users ต่อ
                const user = data.user;
                const { data: adminData, error: adminError } = await supabase
                    .from('admin_users')
                    .select('role, status') // 💡 เพิ่มการดึงค่า status มาเช็กตั้งแต่ตอนล็อกอิน
                    .eq('id', user.id)
                    .single();

                if (adminError || !adminData) {
                    // ถ้าไม่มีชื่อในตาราง admin_users ให้เตะออกทันที
                    await supabase.auth.signOut();
                    alert("คุณไม่มีสิทธิ์เข้าใช้งานระบบนี้ (Admin Only)");
                    return;
                }

                // 💡 เช็กก่อนว่าบัญชี ณ ตอนล็อกอิน โดนระงับอยู่หรือไม่
                if (adminData.status === 'ระงับใช้งาน') {
                    await supabase.auth.signOut();
                    alert("บัญชีของคุณถูกระงับการใช้งานแล้ว");
                    return;
                }

                // สิทธิ์ถูกต้อง (Owner / Admin) -> พาไปหน้าแดชบอร์ด
                alert(`ยินดีต้อนรับคุณ ${email} สถานะ: ${adminData.role}`);
                window.location.href = 'dashboard.html';

            } catch (err) {
                alert("เข้าสู่ระบบไม่สำเร็จ: " + err.message);
            }
        });
    }

    // 🟢 เรียกฟังก์ชันตรวจจับการโดนระงับสิทธิ์แบบ Realtime เผื่อกรณีเปิดหน้าเว็บค้างไว้
    initRealtimeStatusCheck();
});

/**
 * 🟢 ฟังก์ชันหลักสำหรับตั้งค่าระบบเช็กสถานะการโดนระงับใช้งานแบบ Realtime
 */
async function initRealtimeStatusCheck() {
    // ตรวจสอบความพร้อมของ Supabase
    if (typeof supabase === 'undefined' || !supabase) return;

    // ดึงข้อมูล User ปัจจุบันที่กำลังล็อกอินอยู่บนหน้าเว็บนั้นๆ
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // ถ้าไม่ได้ล็อกอินอยู่ (เช่น อยู่หน้า index.html) ก็ไม่ต้องทำอะไรต่อ

    // เริ่มสร้างการเชื่อมต่อดักฟังข้อมูล (Realtime Subscription)
    supabase
        .channel('admin_status_realtime')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',         // ดักฟังเฉพาะตอนที่ Owner กด UPDATE ข้อมูล
                schema: 'public',
                table: 'admin_users',    // ดักฟังตาราง admin_users
                filter: `id=eq.${user.id}` // เจาะจงดักฟังเฉพาะแถวที่เป็น ID ของ Admin คนที่เปิดหน้านี้อยู่เท่านั้น
            },
            async (payload) => {
                // 💡 ตรง payload.new.status ให้ปรับคำในเครื่องหมายอัญประกาศอ้างอิงตามค่าที่คุณกรอกลงฐานข้อมูลจริง
                // เช่น ถ้าใน DB เก็บคำว่า 'suspended' หรือ 'disabled' ให้เปลี่ยนจาก 'ระงับใช้งาน' เป็นคำนั้นๆ ครับ
                if (payload.new && payload.new.status === 'ระงับใช้งาน') {
                    alert('🚨 บัญชีของคุณถูกระงับการใช้งานโดยผู้ดูแลระบบ ระบบจะนำคุณออกจากระบบทันที');

                    // ล้าง session ในเครื่องของ Admin คนนี้
                    localStorage.removeItem('sb-admin-auth');
                    await supabase.auth.signOut();

                    // ดีดเด้งกลับไปหน้าล็อกอินหลัก
                    window.location.href = 'index.html';
                }
            }
        )
        .subscribe();
}
