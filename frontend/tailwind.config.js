/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gomher: {
          blue: '#0055ff', // Azul eléctrico
          red: '#ff2a2a',  // Rojo eléctrico
          gray: '#f4f5f7', // Gris tenue para fondo
          dark: '#1a1f2e'  // Azul/Gris oscuro para textos elegantes
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Tipografía moderna
      }
    },
  },
  plugins: [],
}
