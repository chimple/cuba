import json
import os
import csv
import glob

IMPORT_JSON_PATH = 'public/databases/import.json'
IMPORT_DATA_DIR = 'public/databases/import_data'

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

def parse_csv_value(value, column_name):
    # Handle booleans for integer columns (like is_deleted)
    if column_name == 'is_deleted':
        if value.lower() == 'true': return 1
        if value.lower() == 'false': return 0
        if value == '1' or value == '0': return int(value)
    
    # Handle NULLs
    if value == '' or value.lower() == 'null':
        return None
    
    return value

def to_iso_string(value):
    """
    Converts value (string or datetime) to ISO 8601 string with +00:00 suffix.
    Format: YYYY-MM-DDTHH:MM:SS.mmmmmm+00:00
    """
    if isinstance(value, str):
        # Strip whitespace and quotes
        value = value.strip().strip("'").strip('"')
        
        # Transformation: 2025-03-27 06:35:10.629219+00 -> 2025-03-27T06:35:10.629219+00:00
        if ' ' in value and value.endswith('+00'):
            value = value.replace(' ', 'T').replace('+00', '+00:00')
        
        # Handle Z suffix -> +00:00
        if value.endswith('Z'):
            return value[:-1] + '+00:00'
            
        # Ensure +00:00 suffix
        if not value.endswith('+00:00'):
             if 'T' in value:
                 return value + '+00:00'
             # If it doesn't have T (unlikely given previous logic, but just in case)
             # return value + '+00:00' 
        return value
        
    if hasattr(value, 'strftime'):
        # datetime object
        return value.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + '+00:00'
        
    return value

def get_column_type_map(table_schema):
    col_map = {}
    for col in table_schema:
        if 'column' in col:
            col_name = col['column']
            col_type = col['value'].upper()
            col_map[col_name] = col_type
    return col_map

def cast_value(value, col_type):
    if value is None: return None
    if 'INTEGER' in col_type or 'BOOLEAN' in col_type:
        try:
            return int(value)
        except:
            return value # Keep as is if fails
    return value

def process_table(table_node, csv_path):
    table_name = table_node['name']
    print(f"Processing table: {table_name}")
    
    schema = table_node['schema']
    col_type_map = get_column_type_map(schema)
    ordered_columns = [col['column'] for col in schema if 'column' in col]
    
    new_values = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_values = []
            for col in ordered_columns:
                val = row.get(col)
                
                # Special handling
                val = parse_csv_value(val, col)
                val = cast_value(val, col_type_map.get(col, 'TEXT'))
                
                if col in ['created_at', 'updated_at']:
                    # Debug print for first few rows
                    # if len(new_values) < 1: 
                    #     print(f"  Formatting {col}: {val} -> {to_iso_string(val)}")
                    val = to_iso_string(val)

                row_values.append(val)
            new_values.append(row_values)
            
    table_node['values'] = new_values
    print(f"  Updated {len(new_values)} rows.")
    return table_name

def main():
    if not os.path.exists(IMPORT_JSON_PATH):
        print(f"Error: {IMPORT_JSON_PATH} not found.")
        return

    data = load_json(IMPORT_JSON_PATH)
    
    # Map table names to their nodes for easy access
    table_map = {t['name']: t for t in data['tables']}
    
    csv_files = glob.glob(os.path.join(IMPORT_DATA_DIR, '*_rows.csv'))
    
    if not csv_files:
        print(f"No CSV files found in {IMPORT_DATA_DIR}")
        return

    processed_tables = []
    for csv_file in csv_files:
        filename = os.path.basename(csv_file)
        # Assuming filename is tablename_rows.csv
        parts = filename.split('_rows.csv')
        if len(parts) != 2:
            print(f"Skipping file {filename}: does not match *_rows.csv pattern")
            continue
            
        table_name = parts[0]
        
        if table_name in table_map:
            try:
                process_table(table_map[table_name], csv_file)
                processed_tables.append(table_name)
            except Exception as e:
                print(f"Error processing {table_name}: {e}")
        else:
            print(f"Warning: Table '{table_name}' from {filename} not found in import.json")

    # Update pull_sync_info
    sync_table = next((t for t in data['tables'] if t['name'] == 'pull_sync_info'), None)
    if sync_table:
        print("Updating pull_sync_info dates...")
        from datetime import datetime, timezone, timedelta
        
        # SqliteApi.ts logic: "now - 1 minute"
        # User manually changed to "days=1" - preserving "now - 1 day" as per recent edit
        
        now = datetime.now(timezone.utc)
        sync_time  = now - timedelta(days=1) 
        
        sync_time_str = to_iso_string(sync_time)

        for row in sync_table.get('values', []):
            t_name = row[0]
            
            # Update date for all processed tables
            if t_name in processed_tables:
                 row[1] = sync_time_str
                 print(f"  Updated sync date for {t_name}")

    save_json(IMPORT_JSON_PATH, data)
    print("Done. import.json updated.")

if __name__ == '__main__':
    main()
