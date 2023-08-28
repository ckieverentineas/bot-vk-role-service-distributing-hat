module.exports = {
  apps: [
      {
          name: "HAT",
          script: "npm",
          automation: false,
          args: "run dev",
          env: {
              NODE_ENV: "development"
          },
          env_production: {
              NODE_ENV: "production"
          }
      }
  ]
};
