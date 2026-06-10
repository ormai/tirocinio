import type { ClingoError, ClingoResult } from 'clingo-wasm';
import { createRequire } from 'module';
import type { Preference } from './preference';

const require = createRequire(import.meta.url);
const clingo = require('clingo-wasm') as {
  init: () => Promise<void>;
  run: (program: string, models?: number, options?: string[]) => Promise<ClingoError | ClingoResult>;
};

await clingo.init();

interface Structure {
  id: number;
  name: string;
  area: string | null;
  siteId: number | null;
  capacity: number | null;
}

interface Assignment {
  studentId: number;
  structureId: number;
  month: number;
}

/**
 * The logic program that produces the assignments.
 */
const encoding = `
#show assign/3.

{ assign(Student, StructureId, Month) : prefers(Student, SiteId, Month, _, _),
  structure(StructureId, SiteId, _, _) } = 1 :- prefers(Student, _, Month, _, _).
`;

// In: prefers(StudentId, SiteId, Month, Weight, ExpressedAtInstant).
//     structure(StructureId, SiteId, Area, Capacity).
//     pastAssignment(StudentId, Area).
//
// NOTE: ExpressedAtInstant is the instant -- in seconds because with
//       milliseconds Clingo's 32-bit integers would overflow -- in which
//       the preference was created. Helpful in case where preferences
//       expressed earlier have more priority.
//
// Out: assign(StudentId, StructureId, Month).
export async function generateAssignment(
  preferences: ReadonlyArray<Omit<Preference, 'collectionId'>>,
  structures: ReadonlyArray<Structure>,
  pastAssignments: ReadonlyArray<{ studentId: number | null; area: string | null }>,
  timeoutSeconds: number | null,
): Promise<Assignment[] | null> {
  const facts = [
    preferences.map(({ studentId, siteId, month, weight, createdAt }) =>
      `prefers(${studentId},${siteId},${month + 1},${weight},${Math.trunc(createdAt.getTime() / 1000)}).`
    ).join(''),
    structures.map(({ id, siteId, area, capacity }) => `structure(${id},${siteId},"${area}",${capacity}).`).join(''),
    pastAssignments.map(({ studentId, area }) => `pastAssignment(${studentId},"${area}").`).join(''),
  ].join('');

  const options: string[] = [];
  if (timeoutSeconds != null && timeoutSeconds !== 0) {
    options.push(`--time-limit=${timeoutSeconds}`);
  }

  const result: ClingoError | ClingoResult = await clingo.run(facts + encoding, 1, options);

  if (result.Result === 'SATISFIABLE' || result.Result === 'OPTIMUM FOUND') {
    const { Time: time, Value: atoms } = result.Call[0].Witnesses[0] as { Time: number; Value: string[] };
    console.info('Answer set found in', time, 's');
    return parseAssignments(atoms);
  } else {
    console.warn(result);
  }
  return null;
}

function parseAssignments(atoms: string[]): Assignment[] {
  return atoms.map((atom) => atom.match(/^assign\((.+)\)$/))
    .filter(Boolean)
    .map((matches) => {
      const [student, structure, month] = matches![1].split(',');
      return { studentId: Number(student), structureId: Number(structure), month: Number(month) };
    });
}
