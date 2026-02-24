import { supabase } from "./db.js";

async function inspectHandshakesTable() {
    console.log("🔍 Inspecting 'handshakes' table...");
    const { data, error } = await supabase.from("handshakes").select("*").limit(1);
    if (error) {
        console.error("❌ Error fetching handshakes:", error);
    } else if (data && data.length > 0) {
        console.log("✅ Columns found in 'handshakes' table:", Object.keys(data[0]));
    } else {
        console.log("⚠️ No handshakes found. Attempting to get columns via RPC...");
        // This is a fallback to try and guess or use common columns if empty
    }
}

inspectHandshakesTable();
