import { APP_NAME, User } from '../../../packages/shared/src/index';
import { createButton } from '../../../packages/ui/src/index';

const adminUser: User = {
  id: '1',
  name: 'Admin',
  email: 'admin@rout2me.com',
};

const welcomeButton = createButton({
  text: `Welcome to ${APP_NAME} Admin`,
  variant: 'primary',
});

console.log('Admin Web App initialized');
console.log('User:', adminUser);
console.log('Button:', welcomeButton.render());
