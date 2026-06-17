import { coursesData } from '../data/courses';

// Mapping of recommended major elective codes for each career track.
export const TRACK_ELECTIVES: Record<string, string[]> = {
  programmer: coursesData
    .filter(
      (c) =>
        c.category === 'Major_Elective' &&
        (c.track === 'Programmer' || c.track === 'Dev')
    )
    .map((c) => c.code),
  artist: coursesData
    .filter((c) => c.category === 'Major_Elective' && c.track === 'Artist')
    .map((c) => c.code),
  designer: coursesData
    .filter((c) => c.category === 'Major_Elective' && c.track === 'Design')
    .map((c) => c.code),
  misc: coursesData
    .filter((c) => c.category === 'Major_Elective' && !c.track)
    .map((c) => c.code)
};
