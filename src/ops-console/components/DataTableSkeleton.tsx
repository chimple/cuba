import { Skeleton, TableBody, TableCell, TableRow } from '@mui/material';
import type { Column } from './DataTableBody';

export function TableSkeleton<T extends object>({
  columns,
  rows = 10,
  showSelectionColumn = false,
}: {
  columns: Column<T>[];
  rows?: number;
  showSelectionColumn?: boolean;
}) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {showSelectionColumn && (
            <TableCell
              id="data-tablebody-skeleton-selection-cell"
              className="data-tablebody-skeleton-selection-cell"
            >
              <Skeleton
                id="data-tablebody-skeleton-selection-icon"
                variant="circular"
                className="data-tablebody-skeleton-selection-icon"
              />
            </TableCell>
          )}
          {columns.map((col) => (
            <TableCell
              key={String(col.key)}
              align="left"
              sx={{
                py: 0.25,
                px: 1,
                height: 32,
                transform: 'none',
              }}
            >
              <div style={{ width: '90%' }}>
                <Skeleton
                  variant="rectangular"
                  height={24}
                  width="100%"
                  sx={{ mx: 0, ml: 0, transform: 'none' }}
                />
              </div>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
