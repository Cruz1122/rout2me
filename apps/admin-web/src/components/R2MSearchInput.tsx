import { colorClasses } from '../styles/colors';

interface R2MSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * R2MSearchInput - Componente de búsqueda reutilizable
 *
 * @param {string} value - Valor actual del input de búsqueda
 * @param {function} onChange - Función que se ejecuta cuando el valor cambia
 * @param {string} placeholder - Texto del placeholder (opcional)
 */
export default function R2MSearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
}: R2MSearchInputProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <i className="ri-search-line text-xl text-[#97A3B1]"></i>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        className={`w-full pl-12 pr-4 py-3 rounded-xl border border-[#dcdfe5] ${colorClasses.textPrimary} placeholder:text-[#97A3B1] focus:outline-none focus:ring-2 focus:ring-[#1E56A0] focus:border-transparent transition-all`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
