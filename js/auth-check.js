// js/auth-check.js

/**
 * 1. ฟังก์ชันตรวจสอบสิทธิ์การเข้าถึงระบบแบบปกติ (รันทันทีเมื่อโหลดไฟล์นี้)
 */
async function checkAdminAccess() {
    // เลือกใช้ตัวแปรสิทธิ์ฐานข้อมูล Supabase
    const client = typeof supabase !== 'undefined' ? supabase : window.supabaseClient;

    if (!client) {
        console.error("ไม่พบฐานข้อมูล Supabase กรุณาตรวจสอบการโหลดลำดับไฟล์สคริปต์ในหน้า HTML");
        return;
    }

    try {
        const { data: { user } } = await client.auth.getUser();

        // เงื่อนไขที่ 1: ถ้ายังไม่ได้ล็อกอิน ให้ส่งกลับไปหน้า index.html ทันที
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        // เงื่อนไขที่ 2: ตรวจสอบข้อมูลจากตาราง admin_users ด้วยอีเมลของผู้ล็อกอิน
        const { data, error } = await client
            .from('admin_users')
            .select('role, status')
            .eq('email', user.email)
            .single();

        // เงื่อนไขที่ 3: ถ้าเกิดข้อผิดพลาด หรือ ไม่มีข้อมูลอีเมลนี้ในระบบ ให้เตะออก
        if (error || !data) {
            alert("คุณไม่มีสิทธิ์เข้าถึงระบบนี้!");
            await client.auth.signOut();
            window.location.href = 'index.html';
            return;
        }

        // เงื่อนไขที่ 4: 🛑 ตรวจสอบสถานะ (อัปเดตเป็น 'ระงับการใช้งาน' ให้ตรงกับในฐานข้อมูล Supabase ของคุณ)
        if (data.status === 'ระงับการใช้งาน') {
            alert("บัญชีของคุณถูกระงับการใช้งานโดยผู้ดูแลระบบ");
            localStorage.removeItem('sb-admin-auth');
            await client.auth.signOut();
            window.location.href = 'index.html';
            return;
        }

        // เงื่อนไขที่ 5: ตรวจเช็กสิทธิ์แอดมินทั่วไป (Admin เท่านั้นห้ามเข้าหน้าอื่นนอกจาก orders.html)
        const currentPath = window.location.pathname;
        if (data.role === 'Admin' && !currentPath.includes('orders.html')) {
            alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้!");
            window.location.href = 'orders.html';
        }

    } catch (err) {
        console.error("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์:", err);
    }
}

/**
 * 2. 🟢 ฟังก์ชันระบบ Realtime ดักจับสถานะจาก Supabase ตลอดเวลาที่เปิดหน้าเว็บค้างไว้
 */
async function initRealtimeStatusCheck() {
    const client = typeof supabase !== 'undefined' ? supabase : window.supabaseClient;
    if (!client) return;

    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    // ล้าง Channel เดิมที่อาจค้างอยู่ก่อนทำการ Subscribe ใหม่เพื่อป้องกันข้อผิดพลาดใน Console
    await client.channel('admin_status_realtime_stream').unsubscribe();

    // สร้าง Channel สำหรับดักฟังสัญญาณเรียลไทม์
    client
        .channel('admin_status_realtime_stream')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'admin_users',
                filter: `email=eq.${user.email}` // ตรวจสอบผ่านอีเมลตนเอง
            },
            async (payload) => {
                // 💡 เปลี่ยนเงื่อนไขเช็กเป็นคำว่า 'ระงับการใช้งาน' ให้ตรงกับ Database ตัวจริง
                if (payload.new && payload.new.status === 'ระงับการใช้งาน') {
                    alert('🚨 บัญชีของคุณถูกระงับการใช้งานโดยผู้ดูแลระบบ ระบบจะนำคุณออกจากระบบทันที');

                    localStorage.removeItem('sb-admin-auth');
                    await client.auth.signOut();
                    window.location.href = 'index.html';
                }
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log("🟢 ระบบสตรีม Realtime ตรวจจับสิทธิ์แอดมินเริ่มเชื่อมต่อเรียบร้อยแล้ว");
            }
        });
}

// 🚀 รันตรวจสอบสิทธิ์ด่านแรกทันที
checkAdminAccess();

// 🚀 สั่งให้ระบบ Realtime เริ่มทำงานเมื่อโครงสร้างหน้าเว็บพร้อม
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRealtimeStatusCheck);
} else {
    initRealtimeStatusCheck();
}
