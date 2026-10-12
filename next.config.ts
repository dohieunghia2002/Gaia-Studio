import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // instrumentation.ts dùng undici của Node để giữ kết nối; để Node tự nạp, không đóng gói lại.
  serverExternalPackages: ["undici"],
};

export default nextConfig;
