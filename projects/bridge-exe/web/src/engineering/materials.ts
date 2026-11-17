// Material presets. Real presets carry the published value and where it comes from (docs/SOURCES.md); every value stays
// editable in the Design Lab. fy is only used by the educational proxy, never as a capacity or a code check.
import type { Material } from './types';
import { GPa, MPa } from './units';

export const MATERIALS: Material[] = [
  { id: 'steel-e250', name: 'Structural steel E250', E: GPa(200), rho: 7850, fy: MPa(250),
    source: 'IS 800:2007 cl. 2.2.4.1 (E = 2.0×10⁵ MPa, unit mass 7850 kg/m³); IS 2062 grade E250 nominal yield 250 MPa' },
  { id: 'al-6061-t6', name: 'Aluminium 6061-T6', E: GPa(68.9), rho: 2700, fy: MPa(276),
    source: 'ASM Aluminum 6061-T6 typical properties (E 68.9 GPa, density 2.70 g/cm³, tensile yield 276 MPa)' },
  { id: 'toy-soft', name: 'Soft teaching material (fictional)', E: GPa(20), rho: 2000, fy: MPa(60),
    source: 'Fictional, for teaching only: a deliberately soft material so deflections are easy to see' },
];
export const materialById = (id: string) => MATERIALS.find((m) => m.id === id) ?? MATERIALS[0];
