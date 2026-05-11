/** PM2: api + web (ver root package.json → dev:api-web). Arranque: pm2 start ecosystem.dieta-mia.cjs */
module.exports = {
  apps: [
    {
      name: 'dieta-mia',
      cwd: __dirname,
      script: 'npm',
      args: 'run dev:api-web',
      interpreter: 'none',
      watch: false,
    },
  ],
};
