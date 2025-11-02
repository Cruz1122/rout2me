import { useNavigate } from 'react-router-dom';
import { colorClasses } from '../styles/colors';
import R2MButton from './R2MButton';

interface AuthHeaderProps {
  readonly showSignUp?: boolean;
}

export default function AuthHeader({ showSignUp = true }: AuthHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] px-10 py-3">
      <div className={`flex items-center gap-4 ${colorClasses.textPrimary}`}>
        <div className="w-8 h-8 flex items-center justify-center">
          <img
            src="/icon-metadata.webp"
            alt="Rout2Me"
            className="w-full h-full object-contain"
            style={{
              filter:
                'brightness(0) saturate(100%) invert(23%) sepia(85%) saturate(1420%) hue-rotate(195deg) brightness(91%) contrast(93%)',
            }}
          />
        </div>
        <h2
          className={`${colorClasses.textPrimary} text-lg font-bold leading-tight tracking-[-0.015em]`}
        >
          Rout2Me Admin
        </h2>
      </div>
      <R2MButton
        variant="secondary"
        size="md"
        onClick={() => navigate(showSignUp ? '/signup' : '/signin')}
      >
        {showSignUp ? 'Registrarse' : 'Iniciar Sesión'}
      </R2MButton>
    </header>
  );
}
