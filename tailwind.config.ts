import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // WSR brand colors — edit these to change the whole site's palette
        'wsr-navy':   '#0b1c3d',   // dark navbar / hero background
        'wsr-blue':   '#1a3a6b',   // secondary blue
        'wsr-accent': '#e8a020',   // gold/orange accent
        'wsr-light':  '#f4f7fb',   // light section background
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
export default config
