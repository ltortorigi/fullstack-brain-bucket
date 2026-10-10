module.exports = {
  apps: [{
    name: 'app',
    script: 'app.js',
    cwd: __dirname,
    env: {NODE_ENV: 'production', PORT: 3000, ENABLE_DEV_TOOLS: 'false'},
  }],
};
