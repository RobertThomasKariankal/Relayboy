import { supabase } from "./db.js";
import fs from "fs";

async function forceInspect() {
    console.log("🔍 Probing 'handshakes' table with sender, receiver, ciphertext...");
    const { error } = await supabase.from("handshakes").insert({
        sender: "test_sender",
        receiver: "test_receiver",
        ciphertext: "test_ciphertext"
    });
    if (error) {
        fs.writeFileSync("handshake_error_2.json", JSON.stringify(error, null, 2));
        console.log("✅ Error dumped to handshake_error_2.json");
    } else {
        console.log("✅ Insert successful! Now checking existing columns of that row.");
        const { data } = await supabase.from("handshakes").select("*").eq("sender", "test_sender").limit(1);
        fs.writeFileSync("handshake_row.json", JSON.stringify(data, null, 2));
    }
}

forceInspect();
