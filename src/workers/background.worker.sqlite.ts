import {
  PrepareSyncBatchesPayload,
  SqlStatement,
} from './background.worker.types';

export const safeTableName = (tableName: string): string => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)) {
    throw new Error(`Invalid table name received in worker: ${tableName}`);
  }
  return tableName;
};

const normalizeSqliteValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (
    value &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return JSON.stringify(value);
  }
  return value;
};

const MAX_SQLITE_BIND_PARAMS = 900;

const getRowFieldNames = (
  row: Record<string, unknown>,
  existingColumns: string[],
): string[] =>
  existingColumns.filter((columnName) =>
    Object.prototype.hasOwnProperty.call(row, columnName),
  );

const buildUpsertStatement = (
  tableName: string,
  fieldNames: string[],
  rowValuesList: unknown[][],
): SqlStatement => {
  const placeholdersPerRow = `(${fieldNames.map(() => '?').join(', ')})`;
  const valuesPlaceholders = rowValuesList
    .map(() => placeholdersPerRow)
    .join(', ');
  const values = rowValuesList.flat();
  const updateColumns = fieldNames.filter((name) => name !== 'id');
  const updateSetClause = updateColumns
    .map((name) => `${name} = excluded.${name}`)
    .join(', ');
  const onConflictClause = updateSetClause
    ? `ON CONFLICT(id) DO UPDATE SET ${updateSetClause}`
    : 'ON CONFLICT(id) DO NOTHING';

  return {
    statement: `
          INSERT INTO ${tableName} (${fieldNames.join(', ')})
          VALUES ${valuesPlaceholders}
          ${onConflictClause};
        `,
    values,
  };
};

export const buildStatementsForRows = (
  tableName: string,
  rows: Record<string, unknown>[],
  existingColumns: string[],
): { statements: SqlStatement[]; rowCount: number } => {
  const resolvedTableName = safeTableName(tableName);
  const statementsForTable: SqlStatement[] = [];
  let validRowCount = 0;
  let currentFieldNames: string[] | null = null;
  let currentRowValuesList: unknown[][] = [];

  const flushCurrentGroup = () => {
    if (!currentFieldNames || currentRowValuesList.length === 0) {
      return;
    }
    statementsForTable.push(
      buildUpsertStatement(
        resolvedTableName,
        currentFieldNames,
        currentRowValuesList,
      ),
    );
    currentFieldNames = null;
    currentRowValuesList = [];
  };

  for (const row of rows) {
    const fieldNames = getRowFieldNames(row, existingColumns);
    if (!fieldNames.length) {
      continue;
    }
    const values = fieldNames.map((name) => normalizeSqliteValue(row[name]));
    const maxRowsPerStatement = Math.max(
      Math.floor(MAX_SQLITE_BIND_PARAMS / fieldNames.length),
      1,
    );
    const fieldSignature = fieldNames.join('|');
    const currentSignature = currentFieldNames?.join('|');

    if (
      currentFieldNames &&
      (currentSignature !== fieldSignature ||
        currentRowValuesList.length >= maxRowsPerStatement)
    ) {
      flushCurrentGroup();
    }

    if (!currentFieldNames) {
      currentFieldNames = fieldNames;
    }

    currentRowValuesList.push(values);
    validRowCount += 1;

    if (currentRowValuesList.length >= maxRowsPerStatement) {
      flushCurrentGroup();
    }
  }
  flushCurrentGroup();

  return {
    statements: statementsForTable,
    rowCount: validRowCount,
  };
};

export const buildSyncBatches = (
  payload: PrepareSyncBatchesPayload,
): {
  tableBatches: Record<string, SqlStatement[][]>;
  rowCountByTable: Record<string, number>;
  payloadSizeBytes: number;
} => {
  const {
    tables,
    tableColumns,
    defaultBatchSize,
    userTableBatchSize,
    userTableName,
  } = payload;
  const tableBatches: Record<string, SqlStatement[][]> = {};
  const rowCountByTable: Record<string, number> = {};

  for (const [tableName, rows] of Object.entries(tables)) {
    const resolvedTableName = safeTableName(tableName);
    const existingColumns = tableColumns[resolvedTableName] ?? [];
    if (!rows?.length || !existingColumns.length) {
      continue;
    }

    const { statements: statementsForTable, rowCount } = buildStatementsForRows(
      resolvedTableName,
      rows,
      existingColumns,
    );
    if (!statementsForTable.length) {
      continue;
    }

    const batchSize =
      resolvedTableName === userTableName
        ? Math.max(userTableBatchSize, 1)
        : Math.max(defaultBatchSize, 1);
    const chunked: SqlStatement[][] = [];
    for (let i = 0; i < statementsForTable.length; i += batchSize) {
      chunked.push(statementsForTable.slice(i, i + batchSize));
    }

    tableBatches[resolvedTableName] = chunked;
    rowCountByTable[resolvedTableName] = rowCount;
  }

  const payloadSizeBytes = payload.includePayloadSizeBytes
    ? new TextEncoder().encode(JSON.stringify(tables)).length
    : 0;

  return {
    tableBatches,
    rowCountByTable,
    payloadSizeBytes,
  };
};
