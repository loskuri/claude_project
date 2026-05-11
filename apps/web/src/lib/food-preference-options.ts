/** Opciones sugeridas para chips (onboarding y ajustes). Los valores guardados que no estén en la lista también se muestran como chip. */

export const COMMON_ALLERGIES = [
  'Gluten',
  'Lactosa',
  'Maní',
  'Nueces',
  'Huevo',
  'Soja',
  'Mariscos',
  'Pescado',
] as const;

export const COMMON_DISLIKED_FOODS = [
  'Cilantro',
  'Brócoli',
  'Berenjena',
  'Hígado',
  'Picante fuerte',
  'Pescado',
  'Champiñones',
  'Queso fuerte',
  'Vísceras',
  'Aceitunas',
] as const;

export const COMMON_CUISINES = [
  'Argentina',
  'Italiana',
  'Mexicana',
  'Japonesa',
  'China',
  'Mediterránea',
  'India',
  'Árabe',
  'Coreana',
  'Peruana',
  'Thai',
  'Americana',
] as const;

export function chipLabels(common: readonly string[], selected: readonly string[]): string[] {
  const out = [...common];
  for (const s of selected) {
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}
