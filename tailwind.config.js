/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html'],
  theme: {
    extend: {
      colors: {
        ink:      '#1A1A1A',  // soft near-black (no pure #000)
        muted:    '#5C5C5C',  // secondary text
        faint:    '#6E6A63',  // labels / tertiary
        accent:   '#B8893C',  // warm gold — barely-there whisper (hover only)
        'accent-hover': '#9A7330',
        surface:  '#F6F4F0',  // warm near-white band
        hairline: '#E6E3DD',  // hairline dividers
      },
      fontFamily: {
        sans:    ['"Hanken Grotesk Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif:   ['"Cormorant Variable"', 'ui-serif', 'Georgia', 'serif'],
        script:  ['"Pinyon Script"', 'ui-serif', 'cursive'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
}
