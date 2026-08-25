import { loadRDKit, type RDKitOptions } from './rdkit';

/**
 * O desenho plano da molécula, em SVG.
 *
 * Quem desenha é o RDKit, a partir da estrutura que ele mesmo sanitizou — o
 * traço na página pública é o mesmo que o motor entende, e não uma segunda
 * representação que pode discordar.
 */

export interface DepictionOptions extends RDKitOptions {
  readonly width?: number;
  readonly height?: number;
}

const WIDTH = 420;
const HEIGHT = 320;

/** SVG da estrutura, ou `null` quando o RDKit não aceita a entrada. */
export async function depict(
  input: string,
  options: DepictionOptions = {},
): Promise<string | null> {
  if (input.trim() === '') return null;

  const rdkit = await loadRDKit(options);

  let mol;
  try {
    mol = rdkit.get_mol(input);
  } catch {
    return null;
  }

  if (mol === null) return null;

  try {
    if (!mol.is_valid()) return null;
    if (!mol.has_coords()) mol.set_new_coords();

    return mol.get_svg(options.width ?? WIDTH, options.height ?? HEIGHT);
  } finally {
    mol.delete();
  }
}
