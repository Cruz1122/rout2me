// Paleta de colores de Route2Me
export const colors = {
  primary: '#163172',
  secondary: '#1E56A0',
  terciary: '#97A3B1',
  bg: '#F6F6F6',
  surface: '#D6E4F0',
  text: '#163172',
  accent: '#1E56A0',
} as const;

// Clases de Tailwind con los colores personalizados
export const colorClasses = {
  // Backgrounds
  bgPrimary: 'bg-[#163172]',
  bgSecondary: 'bg-[#1E56A0]',
  bgTerciary: 'bg-[#97A3B1]',
  bgSurface: 'bg-[#D6E4F0]',
  bgPage: 'bg-[#F6F6F6]',

  // Text
  textPrimary: 'text-[#163172]',
  textSecondary: 'text-[#1E56A0]',
  textTerciary: 'text-[#97A3B1]',

  // Borders
  borderPrimary: 'border-[#163172]',
  borderSecondary: 'border-[#1E56A0]',
  borderSurface: 'border-[#D6E4F0]',

  // Hover states
  hoverPrimary: 'hover:bg-[#163172]',
  hoverSecondary: 'hover:bg-[#1E56A0]',
  hoverSurface: 'hover:bg-[#D6E4F0]',

  // Buttons
  btnPrimary: 'bg-[#163172] hover:bg-[#0f2350] text-white',
  btnSecondary: 'bg-[#1E56A0] hover:bg-[#164280] text-white',
  btnSurface: 'bg-[#D6E4F0] hover:bg-[#c0d4e6] text-[#163172]',
} as const;
