import { supabase } from "./db.js";

async function inspectColumns() {
    console.log("🔍 Inspecting 'messages' table columns...");
    const { data, error } = await supabase.from("messages").select("*").limit(1);
    if (error) {
        console.error("❌ Error fetching messages:", error);
        return;
    }
    if (data && data.length > 0) {
        console.log("Found keys:", Object.keys(data[0]));
        if (Object.keys(data[0]).includes('encrypted')) {
            console.log("✅ 'encrypted' column exists.");
        } else {
            console.warn("⚠️ 'encrypted' column is MISSING.");
        }
    } else {
        console.log("Table is empty, cannot infer columns from select *.");
    }
}

inspectColumns();
