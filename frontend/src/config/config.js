const config = {
  api: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    timeout: 30000,
    uploadTimeout: 60000,
  },

  app: {
    name: 'bizinside.ai',
    version: '1.0.0',
    demoMode: process.env.REACT_APP_DEMO_MODE === 'true',
  },

  storageKeys: {
    token: 'bizinside_token',
    user: 'bizinside_user',
    business: 'bizinside_business',
  },
};

export default config;
