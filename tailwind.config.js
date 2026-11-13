/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Colori aziendali C. Emme Impianti S.r.l.
        aziendale: {
          blu: '#0042ff',
          bluScuro: '#002bb8',
          bluNotte: '#0b1d4f',
          rosso: '#e60000',
          rossoScuro: '#b80000',
          grigioSfondo: '#f4f6fb',
          grigioBordo: '#dbe2ee',
        },
        ferie: {
          intera: '#0042ff',
          mezza: '#38bdf8',
          rol: '#8b5cf6',
          festivo: '#ef4444',
          weekend: '#cbd5e1',
          ponte: '#10b981',
          oggi: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'scheda': '0 4px 20px -2px rgba(0, 66, 255, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'scheda-evidenza': '0 8px 30px -4px rgba(0, 66, 255, 0.16)',
      },
    },
  },
  plugins: [],
};
