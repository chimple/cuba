import { useState, useMemo } from "react";

export type Order = "asc" | "desc";

export function useDataTableLogic<T extends Record<string, any>>(
  rows: T[],
  rowsPerPage = 8
) {
  const [orderBy, setOrderBy] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>("asc");
  const [page, setPage] = useState(1);

  const handleSort = (key: string) => {
    if (orderBy === key) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(key);
      setOrder("asc");
    }
  };

  const sortedRows = useMemo(() => {
    if (!orderBy) return rows;

    return [...rows].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];

      const aRaw =
        typeof aVal === "object" && aVal?.value !== undefined
          ? aVal.value
          : aVal;
      const bRaw =
        typeof bVal === "object" && bVal?.value !== undefined
          ? bVal.value
          : bVal;

      // Handle nullish values
      if (aRaw == null) return order === "asc" ? -1 : 1;
      if (bRaw == null) return order === "asc" ? 1 : -1;

      const aNum = typeof aRaw === "number" ? aRaw : parseFloat(aRaw);
      const bNum = typeof bRaw === "number" ? bRaw : parseFloat(bRaw);

      const bothAreNumbers = !isNaN(aNum) && !isNaN(bNum);

      if (bothAreNumbers) {
        return order === "asc" ? aNum - bNum : bNum - aNum;
      }

      const aStr = aRaw.toString();
      const bStr = bRaw.toString();

      return order === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [rows, orderBy, order]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  const pageCount = Math.ceil(rows.length / rowsPerPage);

  return {
    orderBy,
    order,
    page,
    pageCount,
    setPage,
    handleSort,
    sortedRows,
    paginatedRows,
  };
}
