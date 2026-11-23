/** Tailwind v4 über PostCSS. Der Turbopack-CSS-Loader aus dem
 *  create-next-app-Standard hat Änderungen an globals.css im Dev-Server
 *  nicht zuverlässig neu kompiliert. */
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
