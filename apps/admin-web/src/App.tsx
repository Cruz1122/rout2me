import { useState } from 'react';
import { APP_NAME, User } from '@rout2me/shared';
import './App.css';

function App() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@rout2me.com',
    },
  ]);

  return (
    <div className="app">
      <header>
        <h1>{APP_NAME} - Admin Dashboard</h1>
      </header>
      <main>
        <section className="users-section">
          <h2>Users Management</h2>
          <div className="users-list">
            {users.map((user) => (
              <div key={user.id} className="user-card">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
