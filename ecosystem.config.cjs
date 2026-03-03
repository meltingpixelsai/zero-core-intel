module.exports = {
  apps: [
    {
      name: "harvey-intel",
      script: "dist/index.js",
      cwd: "/home/deploy/projects/harvey-intel",
      node_args: "--enable-source-maps",
      env: {
        NODE_ENV: "production",
        PORT: 8402,
      },
      max_memory_restart: "256M",
      autorestart: true,
      watch: false,
    },
  ],
};
