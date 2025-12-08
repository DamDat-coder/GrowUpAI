module.exports = {
  apps: [
    {
      name: "backend",
      // ⚠️ SỬA path cho đúng VPS (ví dụ):
      // cwd: "/var/www/DA3/server-side",
      cwd: "C:/DuAnTotNghiep/sever-side",

      script: "dist/index.js", // build xong mới có dist/
      // Hoặc: script: "npm", args: "run start:prod"

      // ENV mặc định (dev)
      env: {
        NODE_ENV: "development",
        PORT: "3000",
        HOST: "127.0.0.1",
      },

      autorestart: true,
      max_memory_restart: "600M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
