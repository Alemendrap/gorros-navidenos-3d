/** Resuelve rutas de /public respetando la base de Vite (funciona en subcarpetas de hosting). */
export function assetUrl(path: string) {
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  const base = import.meta.env.BASE_URL || '/';
  return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}
