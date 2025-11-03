import { RiBuilding2Fill } from 'react-icons/ri';

interface OrganizationBadgeProps {
  readonly size?: number;
}

/**
 * Badge que indica que el usuario pertenece a una organización
 */
export default function OrganizationBadge({
  size = 20,
}: OrganizationBadgeProps) {
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: 'var(--color-primary)',
        border: '2px solid #FFFFFF',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }}
      title="Miembro de organización"
    >
      <RiBuilding2Fill size={size * 0.6} style={{ color: '#FFFFFF' }} />
    </div>
  );
}
