module.exports = {
    apps: [
      {
        name: "italian-shoes",
        script: "npm",
        args: "start",
        // Change this to the full path of your italian-shoes folder
        cwd: "/home/ubuntu/italian-shoes",
        env: {
          NODE_ENV: "production",
        },
        env_development: {
          NODE_ENV: "development",
        },
      },
    ],
  };
  