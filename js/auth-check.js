async function checkAdminAccess() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();

    // 1. ถ้ายังไม่ได้ Login ให้ส่งไปหน้า index.html
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // 2. ตรวจสอบว่าเมลนี้อยู่ในตาราง admin_users หรือไม่
    const { data, error } = await window.supabaseClient
        .from('admin_users')
        .select('role') // ดึงแค่ role ก็พอครับ
        .eq('email', user.email)
        .single();

    // 3. ถ้าไม่มีในตาราง หรือ Error ให้ Logout ออก
    if (error || !data) {
        alert("คุณไม่มีสิทธิ์เข้าถึงระบบนี้!");
        await window.supabaseClient.auth.signOut();
        window.location.href = 'index.html';
        return;
    }

    // 4. เงื่อนไขจำกัดสิทธิ์: ถ้าเป็น Admin แต่ไม่ได้อยู่หน้า orders.html ให้ดีดกลับ
    // ใช้ window.location.pathname เพื่อดูชื่อไฟล์ปัจจุบัน
    const currentPath = window.location.pathname;

    if (data.role === 'Admin' && !currentPath.includes('orders.html')) {
        alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้!");
        window.location.href = 'orders.html'; // ดีดกลับไปที่หน้า orders.html
    }
}

// เรียกใช้ฟังก์ชันนี้
checkAdminAccess();
