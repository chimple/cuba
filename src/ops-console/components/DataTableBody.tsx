import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, TableSortLabel
} from '@mui/material';

export interface Column<T> {
  key: keyof T;
  label: string;
  align?: 'left' | 'right' | 'center' | 'justify' | 'inherit';
  render?: (row: T) => React.ReactNode;  
  [key: string]: any; 
}

interface Props {
     columns: Record<string, any>[];
    rows: Record<string, any>[];
    orderBy: string | null;
    order: 'asc' | 'desc';
    onSort: (key: string) => void;
}

const DataTableBody: React.FC<Props> = ({ columns, rows, orderBy, order, onSort }) => (
    <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
        <Table size="small">
            <TableHead>
                <TableRow>
                    {columns.map((col) => (
                        <TableCell key={col.key} align={col.align || 'left'} sx={{ transform: 'none', backgroundColor: '#DDE1E6 !important', height: '48px', }}>
                            <TableSortLabel
                                active={orderBy === col.key}
                                direction={orderBy === col.key ? order : 'asc'}
                                onClick={() => onSort(col.key)}
                            >
                                {col.label}
                            </TableSortLabel>
                        </TableCell>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {rows.map((row, idx) => (
                    <TableRow key={idx} hover
                        onClick={() => { }}
                        sx={{
                            cursor: 'pointer',
                            height: '48px',
                        }}>
                        {columns.map((col) => (
                            <TableCell key={col.key} align={col.align || 'left'}>
                                {typeof row[col.key] === 'object' && row[col.key]?.render !== undefined
                                    ? row[col.key].render
                                    : row[col.key]}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
);

export default DataTableBody;
