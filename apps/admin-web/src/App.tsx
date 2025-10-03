import { useState } from 'react';
import {
  APP_NAME,
  formatCoordinate,
  success,
  isSuccess,
} from '@rout2me/shared';
import type { User, VehiclePing, Result } from '@rout2me/shared';
import './App.css';

function App() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@rout2me.com',
    },
  ]);

  // Demo vehicle data using new types
  const [vehicles] = useState<VehiclePing[]>([
    {
      id: 'bus-001',
      ts: new Date().toISOString(),
      pos: { lat: -12.0464, lng: -77.0428 },
      speed: 45,
    },
    {
      id: 'bus-002',
      ts: new Date().toISOString(),
      pos: { lat: -12.05, lng: -77.04 },
      speed: 32,
    },
  ]);

  // Demo Result type for API simulation
  const getUsersResult: Result<User[]> = success(users);

  return (
    <div className="app">
      <header>
        <h1>{APP_NAME} - Admin Dashboard</h1>
      </header>
      <main>
        <section className="users-section">
          <h2>Users Management</h2>
          {isSuccess(getUsersResult) && (
            <div className="users-list">
              {getUsersResult.data.map((user) => (
                <div key={user.id} className="user-card">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() =>
              setUsers([
                ...users,
                {
                  id: Date.now().toString(),
                  name: 'New User',
                  email: 'new@rout2me.com',
                },
              ])
            }
          >
            Add User
          </button>
        </section>

        <section className="vehicles-section">
          <h2>Vehicle Tracking</h2>
          <div className="vehicles-list">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="vehicle-card">
                <h3>{vehicle.id}</h3>
                <p>Position: {formatCoordinate(vehicle.pos)}</p>
                <p>Speed: {vehicle.speed} km/h</p>
                <p>Last Update: {new Date(vehicle.ts).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
