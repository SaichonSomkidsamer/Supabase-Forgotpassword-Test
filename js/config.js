const SUPABASE_URL = 'https://mvujuqrdofnrcqxyjgxp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dWp1cXJkb2ZucmNxeHlqZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NTY3ODcsImV4cCI6MjA5NzUzMjc4N30.zrd6d84n6CgvhmOKVmO31b69LDE1ojAGrYv6PrvhNxA';

window.supabaseClient = null;

try {
    // ดักจับทั้งแบบ s ตัวเล็ก และ S ตัวใหญ่ เผื่อ CDN แต่ละเจ้าส่งมาไม่เหมือนกัน
    const lib = window.supabase || (typeof Supabase !== 'undefined' ? Supabase : null);

    if (lib) {
        window.supabaseClient = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                storageKey: 'sb-admin-auth',
            }
        });
        console.log("✅ [Success] Supabase Client Connected!");
    } else {
        console.error("❌ [Error] ไม่สามารถดึง Library ของ Supabase ได้จากทุกช่องทาง");
    }
} catch (error) {
    console.error("❌ [Error] เกิดข้อผิดพลาดตอนสั่งสร้าง Client:", error);
}

// 🟩 เพิ่มบรรทัดนี้ไว้ตรงนี้เลยครับ (ล่างสุดของไฟล์นอกปีกกา)
window.supabase = window.supabaseClient;
