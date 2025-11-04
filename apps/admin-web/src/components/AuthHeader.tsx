import { useNavigate } from 'react-router-dom';
import R2MButton from './R2MButton';

interface AuthHeaderProps {
  readonly showSignUp?: boolean;
}

export default function AuthHeader({ showSignUp = true }: AuthHeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className="flex items-center justify-between px-10 py-3"
      style={{ backgroundColor: '#1E56A0' }}
    >
      <div className="flex items-center gap-4">
        <img
          src="/icon-metadata.webp"
          alt="Rout2Me"
          className="w-8 h-8 object-contain"
        />
        <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">
          Rout2Me Admin
        </h2>
      </div>
      <R2MButton
        variant="ghost"
        size="md"
        onClick={() => navigate(showSignUp ? '/signup' : '/signin')}
        className="text-white hover:bg-white/10"
      >
        {showSignUp ? 'Registrarse' : 'Iniciar Sesión'}
      </R2MButton>
    </header>
  );
}
