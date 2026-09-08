import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  { ignores: [".next/**", "node_modules/**", "drizzle/**", "e2e-results/**", "data/**"] },
];

export default config;
