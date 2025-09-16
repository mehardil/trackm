declare module 'mysql2' {
  export interface QueryResult {
    insertId: number;
    affectedRows: number;
    changedRows: number;
  }

  export interface Pool {
    query(sql: string, values?: any[]): Promise<QueryResult>;
  }
} 