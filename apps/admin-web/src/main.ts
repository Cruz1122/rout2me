import { APP_NAME, User } from '../../../packages/shared/src/index';

const adminUser: User = {
  id: '1',
  name: 'Admin',
  email: 'admin@rout2me.com',
};

console.log('Admin Web App initialized');
console.log(`Welcome to ${APP_NAME} Admin`);
console.log('User:', adminUser);
