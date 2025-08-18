export function getGradeOptions<T extends { grade?: string | number }>(items: T[]): string[] {
  const gradesSet = new Set<string>();
  items.forEach((item) => {
    if (item.grade) {
      gradesSet.add(`Grade ${item.grade}`);
    }
  });
  return Array.from(gradesSet).sort();
}

export function filterBySearchAndFilters<T extends {
  user: { name?: string; email?: string; student_id?: string };
  grade?: string | number;
  classSection?: string;
}>(
  items: T[],
  filters: Record<string, string[]>,
  searchTerm: string,
  type: 'student' | 'teacher' = 'student'
): T[] {
  if (!searchTerm && filters.grade.length === 0 && filters.section.length === 0) {
    return items;
  }
  let filtered = items;
  if (filters.grade.length > 0) {
    filtered = filtered.filter((item) => filters.grade.includes(`Grade ${item.grade}`));
  }
  if (filters.section.length > 0) {
    filtered = filtered.filter((item) => filters.section.includes(item.classSection || ""));
  }
  if (searchTerm.trim() !== "") {
    const term = searchTerm.trim().toLowerCase();
    filtered = filtered.filter((item) => {
      if (type === 'student') {
        return (
          (item.user.name && item.user.name.toLowerCase().includes(term)) ||
          (item.user.student_id && item.user.student_id.toLowerCase().includes(term))
        );
      } else {
        return (
          (item.user.name && item.user.name.toLowerCase().includes(term)) ||
          (item.user.email && item.user.email.toLowerCase().includes(term))
        );
      }
    });
  }
  return filtered;
}

export function sortSchoolTeachers<T extends {
  user: { name?: string };
  grade?: string | number;
}>(
  items: T[],
  orderBy: string | null,
  order: 'asc' | 'desc'
): T[] {
  const arr = [...items];
  if (orderBy) {
    arr.sort((a, b) => {
      let aValue: any, bValue: any;
      if (orderBy === "grade") {
        aValue = a.grade;
        bValue = b.grade;
      } else if (orderBy === "name") {
        aValue = a.user.name || "";
        bValue = b.user.name || "";
      } else {
        aValue = (a as any)[orderBy] || "";
        bValue = (b as any)[orderBy] || "";
      }
      if (aValue < bValue) return order === "asc" ? -1 : 1;
      if (aValue > bValue) return order === "asc" ? 1 : -1;
      return 0;
    });
  }
  return arr;
}

// Pagination logic
export function paginateSchoolTeachers<T>(items: T[], page: number, rowsPerPage: number): T[] {
  const startIdx = (page - 1) * rowsPerPage;
  return items.slice(startIdx, startIdx + rowsPerPage);
}
