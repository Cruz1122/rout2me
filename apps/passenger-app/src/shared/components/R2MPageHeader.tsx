interface R2MPageHeaderProps {
  readonly title: string;
}

/**
 * Componente reutilizable para headers de página
 * Mantiene consistencia visual entre todas las páginas
 */
export default function R2MPageHeader({ title }: R2MPageHeaderProps) {
  return (
    <div
      className="sticky top-0 z-50 bg-white backdrop-blur-lg"
      style={{
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
      }}
    >
      <div className="flex items-center justify-center h-14">
        <h1
          className="text-xl font-bold text-center"
          style={{ color: 'var(--color-primary)' }}
        >
          {title}
        </h1>
      </div>
    </div>
  );
}
