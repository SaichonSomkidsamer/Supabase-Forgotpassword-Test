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
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (adminError || !adminData) {
                    // ถ้าไม่มีชื่อในตาราง admin_users ให้เตะออกทันที
                    await supabase.auth.signOut();
                    alert("คุณไม่มีสิทธิ์เข้าใช้งานระบบนี้ (Admin Only)");
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
});
