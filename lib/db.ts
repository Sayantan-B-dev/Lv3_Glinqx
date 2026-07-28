import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

const useLocal =
  process.env.NODE_ENV === "development" &&
  process.env.LOCAL_DATABASE_URL;

let sql: any;
let pool: Pool | undefined;

if (useLocal) {
  pool = new Pool({
    connectionString: process.env.LOCAL_DATABASE_URL,
  });

  sql = async (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => {
    let text = "";
    const params: any[] = [];
    let paramIdx = 0;

    const processValue = (val: any): string => {
      if (val && typeof val === 'object' && Array.isArray(val.strings) && Array.isArray(val.values)) {
        let inner = '';
        let innerIdx = 0;
        val.strings.forEach((s: string, i: number) => {
          inner += s;
          if (i < val.values.length) {
            const v = val.values[i];
            if (v && typeof v === 'object' && Array.isArray(v.strings) && Array.isArray(v.values)) {
              inner += processValue(v);
            } else {
              paramIdx++;
              params.push(v);
              inner += `$${paramIdx}`;
            }
          }
        });
        return inner;
      }
      paramIdx++;
      params.push(val);
      return `$${paramIdx}`;
    };

    strings.forEach((str, i) => {
      text += str;
      if (i < values.length) {
        text += processValue(values[i]);
      }
    });

    const result = await pool!.query(text, params);
    return result.rows;
  };
} else {
  sql = neon(process.env.NEON_DATABASE_URL!);
}

async function query(text: string, values?: any[]) {
  if (useLocal) {
    const result = await pool!.query(text, values);
    return result.rows;
  }
  return sql(text, values);
}

export { sql, query };
export default sql;