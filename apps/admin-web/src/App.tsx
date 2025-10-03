import './App.css';

function App() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        maxWidth: '500px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <h1
        style={{
          color: '#ffffff',
          marginBottom: '1rem',
          fontSize: '2.5rem',
          fontWeight: '800',
        }}
      >
        Admin Dashboard
      </h1>

      <p
        style={{
          fontSize: '1.1rem',
          color: '#888',
          marginBottom: '2rem',
          lineHeight: '1.5',
        }}
      >
        Panel de administración para gestionar rutas, buses y monitorear el
        sistema en tiempo real
      </p>

      <div
        style={{
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '1.5rem',
          width: '100%',
        }}
      >
        <p style={{ margin: 0, color: '#000', fontSize: '0.9rem' }}>
          Listo para desarrollo
        </p>
      </div>
    </div>
  );
}

export default App;
