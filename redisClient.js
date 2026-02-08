import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });
redis.on("error", err => console.error("❌ Redis error:", err));
redis.on("connect", () => console.log("🟢 Redis connected successfully"));

// Non-blocking connection to prevent server startup hang
redis.connect().catch(err => console.error("❌ Redis initial connection failed:", err));

export default redis;