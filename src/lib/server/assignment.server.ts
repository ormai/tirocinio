import type { ClingoError, ClingoResult } from 'clingo-wasm';
import { createRequire } from 'module';
import type { Preference } from './preference';

const require = createRequire(import.meta.url);
const clingo = require('clingo-wasm') as {
  init: () => Promise<void>;
  run: (program: string, models?: number, options?: string[]) => Promise<ClingoError | ClingoResult>;
};

interface Structure {
  id: number;
  name: string;
  area: string | null;
  siteId: number | null;
  capacity: number | null;
  yearOfCourse: number | null;
}

interface Assignment {
  studentId: number;
  structureId: number;
  month: number;
}

interface Student {
  id: number;
  /** The year of the course in which the user is enrolled in */
  yearOfCourse: number;
  /** The number of months for which the internship of this student will last */
  months: number;
}

/**
 * The Answer Set Programming program that produces the assignments.
 *
 * It receives the following facts:
 *
 * - student(Id, YearOfCourse, DurationMonths).
 * - prefers(StudentId, SiteId, Month, Weight, ExpressedAtInstant).
 * - structure(StructureId, SiteId, Area, Capacity, YearOfCourse).
 * - pastAssignment(StudentId, Area).
 *
 * It is expected to produce:
 *
 * - assign(StudentId, StructureId, Month).
 *
 * `ExpressedAtInstant` is the instant -- in seconds because with milliseconds Clingo's 32-bit
 * integers would overflow -- at which the preference was created. Helpful in case where preferences
 * expressed earlier have more priority.
 *
 * `YearOfCourse` for `structure` states than only students of this year of course can be assigned
 * to this structure. A value of `0` means that the constraint is not active.
 *
 * `YearOfCourse` for `student` is an ordinal (1, 2, 3, ...), representing the academic year to
 * which the student is enrolled, determined by subtracting the enrollment year from the current
 * year.
 *
 * `DurationMonths` indicates the duration of the internship in months.
 *
 * ## Summary of the domain
 *
 * In a given 'period', the administrator creates a new collection of preferences, which is an
 * interval of time during which the students can express their preferences, in terms of a Site
 * they want to be assigned to. Each Structure is located in a given Site. The internship for each
 * student depends on the year of their enrollment in the Bachelor's degree, eg. students at the
 * first year will do a a 3-month internship, while students at the third year will do 5 months.
 * Since we know the enrollment year of the student, we determine the year of in course by
 * subtracting the enrollment year to the current year (this might be imprecise, and there might
 * be exceptions, which are not handled at the moment).
 */
const encoding = `
#show assign/3.

{ assign(Student, StructureId, Month) : prefers(Student, SiteId, Month, _, _),
  structure(StructureId, SiteId, _, _, _) } = 1 :- prefers(Student, _, Month, _, _).
`;

/**
 * Serializes the ASP facts, plugs them into the logic program, which it runs. Finally
 * It parses the answer set and returns it.
 *
 * @param timeoutSeconds number of seconds after which to stop the solver
 * @param preferences the preferences collected from the students
 * @param pastAssignments assignments for past years. Can be used to discourage reassigning a
 *        student to the same Area multiple times.
 * @param structures data about the structures to which the students should be assigned
 *        contains the `capacity` of the structure for the whole internship, for the current year
 *
 * @returns - `null` if the program is _unsatisfiable_, or if no optimal answer set could be found
 *          - `'timeout'` if after {@link timeoutSeconds} the solver has not yet found an answer set
 *          - the assignments of students to structure for each month of their internship, otherwise.
 */
export async function generateAssignment(
  students: ReadonlyArray<Student>,
  preferences: ReadonlyArray<Omit<Preference, 'collectionId'> & { yearOfCourse: number }>,
  structures: ReadonlyArray<Structure>,
  pastAssignments: ReadonlyArray<{ studentId: number | null; area: string | null }>,
  timeoutSeconds: number | null,
): Promise<Assignment[] | null | 'timeout'> {
  const facts = [
    students.map(({ id, yearOfCourse, months }) => `student(${id},${yearOfCourse},${months}).`),
    preferences.map(({ studentId, siteId, month, weight, createdAt }) =>
      `prefers(${studentId},${siteId},${month + 1},${weight},${Math.trunc(createdAt.getTime() / 1000)}).`
    ),
    structures.map(({ id, siteId, area, capacity, yearOfCourse }) =>
      `structure(${id},${siteId},"${area}",${capacity},${yearOfCourse ?? 0}).`
    ),
    pastAssignments.map(({ studentId, area }) => `pastAssignment(${studentId},"${area}").`),
  ].flat().join('');

  const options: string[] = [];
  if (timeoutSeconds != null && timeoutSeconds !== 0) {
    options.push(`--time-limit=${timeoutSeconds}`);
  }

  const result: ClingoError | ClingoResult = await clingo.run(facts + encoding, 1, options);

  if (result.Result === 'SATISFIABLE' || result.Result === 'OPTIMUM FOUND') {
    const { Time: time, Value: atoms } = result.Call[0].Witnesses[0] as { Time: number; Value: string[] };
    console.info('Answer set found in', time, 's');
    return parseAssignments(atoms);
  } else if (result.Result === 'UNKNOWN') {
    return 'timeout';
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
