// ไฟล์ js/permission-check.js
async function enforcePermissions() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // ดึงข้อมูล Role จากตาราง admin_users
    const { data, error } = await window.supabaseClient
        .from('admin_users')
        .select('role')
        .eq('email', user.email)
        .single();

    if (data) {
        // ถ้าเป็น Admin และพยายามเข้าหน้าอื่นที่ไม่ใช่ orders.html ให้ดีดกลับ
        if (data.role === 'Admin' && !window.location.pathname.includes('orders.html')) {
            alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้!");
            window.location.href = 'orders.html';
        }
    }
}

// เรียกใช้ฟังก์ชันทันทีที่โหลดหน้าเว็บ
enforcePermissions();
