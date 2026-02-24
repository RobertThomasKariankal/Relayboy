import { supabase } from "./db.js";

async function inspectUsersTable() {
    console.log("🔍 Inspecting 'users' table...");
    const { data, error } = await supabase.from("users").select("*").limit(1);
    if (error) {
        console.error("❌ Error fetching users:", error);
    } else if (data && data.length > 0) {
        console.log("✅ Columns found in 'users' table:", Object.keys(data[0]));
    } else {
        console.log("⚠️ No users found in 'users' table to inspect columns.");
        // Try to fetch a single row to see columns even if empty
        const { data: colData, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'users' });
        if (colError) console.log("Note: Could not use RPC to get columns.");
    }
}

inspectUsersTable();
