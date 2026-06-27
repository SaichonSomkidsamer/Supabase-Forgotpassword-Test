async function checkAdminAccess() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();

    // ถ้ายังไม่ได้ Login ให้ส่งไปหน้า index.html
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // ตรวจสอบว่าเมลนี้อยู่ในตาราง admin_users หรือไม่
    const { data, error } = await window.supabaseClient
        .from('admin_users')
        .select('*')
        .eq('email', user.email)
        .single();

    // ถ้าไม่มีในตาราง ให้ Logout ออกและดีดกลับไปหน้า Login
    if (error || !data) {
        alert("คุณไม่มีสิทธิ์เข้าถึงระบบนี้!");
        await window.supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    }
}

// เรียกใช้ฟังก์ชันนี้
checkAdminAccess();
