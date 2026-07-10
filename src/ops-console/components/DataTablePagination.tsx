import React from 'react';
import { Box, Pagination } from '@mui/material';

interface Props {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

const DataTablePagination: React.FC<Props> = ({ page, pageCount, onPageChange }) => {
  if (pageCount <= 1) return null;

  return (
    <Box display="flex" justifyContent="center" my={2}>
      <Pagination
        count={pageCount}
        page={page}
        onChange={(e, value) => onPageChange(value)}
        color="primary"
        shape="rounded"
      />
    </Box>
  );
};

export default DataTablePagination;
