import "server-only";

import { getSql } from "./neon";

type Row = Record<string, unknown>;
type Filter = { type: "eq" | "neq" | "gte" | "lte" | "in" | "col_lte" | "or"; column: string; value?: unknown };

interface RelationDef {
  alias: string;
  table: string;
  parentColumn: string;
  childColumn: string;
  cardinality: "one" | "many";
  columns: string;
}

const TABLE_RELATIONS: Record<string, RelationDef[]> = {
  products: [
    { alias: "images", table: "product_images", parentColumn: "id", childColumn: "product_id", cardinality: "many", columns: "*" },
    { alias: "category", table: "categories", parentColumn: "category_id", childColumn: "id", cardinality: "one", columns: "*" },
    { alias: "inventory", table: "inventory", parentColumn: "id", childColumn: "product_id", cardinality: "one", columns: "*" },
  ],
  orders: [
    { alias: "order_items", table: "order_items", parentColumn: "id", childColumn: "order_id", cardinality: "many", columns: "*" },
  ],
  invoices: [
    { alias: "invoice_items", table: "invoice_items", parentColumn: "id", childColumn: "invoice_id", cardinality: "many", columns: "*" },
  ],
  reviews: [
    { alias: "customer", table: "customers", parentColumn: "customer_id", childColumn: "id", cardinality: "one", columns: "*" },
  ],
  wishlists: [
    { alias: "product", table: "products", parentColumn: "product_id", childColumn: "id", cardinality: "one", columns: "*" },
  ],
  inventory: [
    { alias: "product", table: "products", parentColumn: "product_id", childColumn: "id", cardinality: "one", columns: "*" },
  ],
  barcodes: [
    { alias: "product", table: "products", parentColumn: "product_id", childColumn: "id", cardinality: "one", columns: "*" },
  ],
};

function parseRelations(table: string, select: string): { columns: string; relations: RelationDef[] } {
  const parts = select.split(",").map((p) => p.trim());
  const baseColumns: string[] = [];
  const relations: RelationDef[] = [];

  for (const part of parts) {
    const relMatch = part.match(/^(\w+):(\w+)\((.+)\)$/);
    const simpleRelMatch = part.match(/^(\w+)\((.+)\)$/);

    if (relMatch) {
      const [, alias, relTable, cols] = relMatch;
      const known = TABLE_RELATIONS[table]?.find((r) => r.alias === alias && r.table === relTable);
      if (known) relations.push({ ...known, columns: cols });
    } else if (simpleRelMatch) {
      const [, alias, cols] = simpleRelMatch;
      const known = TABLE_RELATIONS[table]?.find((r) => r.alias === alias);
      if (known) relations.push({ ...known, columns: cols });
    } else {
      baseColumns.push(part);
    }
  }

  return { columns: baseColumns.length ? baseColumns.join(", ") : "*", relations };
}

function pickColumns(row: Row, columns: string): Row {
  if (columns === "*") return row;
  const cols = columns.split(",").map((c) => c.trim());
  const out: Row = {};
  for (const col of cols) out[col] = row[col];
  return out;
}

async function attachNestedProductRelations(products: Row[], columns: string): Promise<Row[]> {
  const parsed = parseRelations("products", columns);
  return attachRelations(products, parsed.relations);
}

async function attachRelations(rows: Row[], relations: RelationDef[]): Promise<Row[]> {
  if (!rows.length || !relations.length) return rows;
  const sql = getSql();

  for (const rel of relations) {
    const parentIds = [...new Set(rows.map((r) => r[rel.parentColumn]).filter(Boolean))];
    if (!parentIds.length) continue;

    const placeholders = parentIds.map((_, i) => `$${i + 1}`).join(", ");
    const related = (await sql(
      `SELECT * FROM ${rel.table} WHERE ${rel.childColumn} IN (${placeholders})`,
      parentIds
    )) as Row[];

    for (const row of rows) {
      const parentVal = row[rel.parentColumn];
      let matched = related.filter((r) => r[rel.childColumn] === parentVal);

      if (rel.table === "products" && rel.columns.includes("(")) {
        matched = await attachNestedProductRelations(matched, rel.columns);
        const baseCols = parseRelations("products", rel.columns).columns;
        matched = matched.map((r) => (baseCols === "*" ? r : pickColumns(r, baseCols)));
      } else {
        matched = matched.map((r) => pickColumns(r, rel.columns));
      }

      row[rel.alias] = rel.cardinality === "many" ? matched : matched[0] ?? null;
    }
  }

  return rows;
}

class QueryBuilder {
  private table: string;
  private operation: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private selectStr = "*";
  private selectOptions: { count?: string; head?: boolean } = {};
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitVal: number | null = null;
  private offsetVal = 0;
  private payload: Row | Row[] | null = null;
  private onConflict: string | null = null;
  private returnRows = false;
  private singleResult = false;
  private maybeSingleResult = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = "*", options?: { count?: string; head?: boolean }) {
    if (this.operation === "insert" || this.operation === "update" || this.operation === "upsert" || this.operation === "delete") {
      this.returnRows = true;
      if (columns !== "*") this.selectStr = columns;
      return this;
    }
    this.operation = "select";
    this.selectStr = columns;
    this.selectOptions = options ?? {};
    return this;
  }

  insert(data: Row | Row[]) {
    this.operation = "insert";
    this.payload = data;
    return this;
  }

  update(data: Row) {
    this.operation = "update";
    this.payload = data;
    return this;
  }

  upsert(data: Row | Row[], options?: { onConflict?: string }) {
    this.operation = "upsert";
    this.payload = data;
    this.onConflict = options?.onConflict ?? "id";
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown) { this.filters.push({ type: "eq", column, value }); return this; }
  neq(column: string, value: unknown) { this.filters.push({ type: "neq", column, value }); return this; }
  gte(column: string, value: unknown) { this.filters.push({ type: "gte", column, value }); return this; }
  lte(column: string, value: unknown) { this.filters.push({ type: "lte", column, value }); return this; }
  in(column: string, values: unknown[]) { this.filters.push({ type: "in", column, value: values }); return this; }

  filter(column: string, operator: string, value: string) {
    if (operator === "lte") this.filters.push({ type: "col_lte", column, value });
    return this;
  }

  or(expression: string) {
    this.filters.push({ type: "or", column: "", value: expression });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number) { this.limitVal = count; return this; }

  range(from: number, to: number) {
    this.offsetVal = from;
    this.limitVal = to - from + 1;
    return this;
  }

  single() { this.returnRows = true; this.singleResult = true; return this; }
  maybeSingle() { this.returnRows = true; this.maybeSingleResult = true; return this; }

  private buildWhere(params: unknown[]): string {
    const clauses: string[] = [];
    for (const f of this.filters) {
      if (f.type === "eq") { params.push(f.value); clauses.push(`${f.column} = $${params.length}`); }
      else if (f.type === "neq") { params.push(f.value); clauses.push(`${f.column} <> $${params.length}`); }
      else if (f.type === "gte") { params.push(f.value); clauses.push(`${f.column} >= $${params.length}`); }
      else if (f.type === "lte") { params.push(f.value); clauses.push(`${f.column} <= $${params.length}`); }
      else if (f.type === "in") {
        const vals = f.value as unknown[];
        if (!vals.length) clauses.push("FALSE");
        else {
          const ph = vals.map((v) => { params.push(v); return `$${params.length}`; });
          clauses.push(`${f.column} IN (${ph.join(", ")})`);
        }
      } else if (f.type === "col_lte") {
        clauses.push(`${f.column} <= ${f.value}`);
      } else if (f.type === "or") {
        const parts = String(f.value).split(",");
        const orClauses: string[] = [];
        for (const part of parts) {
          const m = part.trim().match(/^(\w+)\.ilike\.%(.+)%$/);
          if (m) { params.push(`%${m[2]}%`); orClauses.push(`${m[1]} ILIKE $${params.length}`); }
        }
        if (orClauses.length) clauses.push(`(${orClauses.join(" OR ")})`);
      }
    }
    return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  }

  async execute(): Promise<{ data: unknown; error: { message: string } | null; count?: number | null }> {
    try {
      const sql = getSql();
      const params: unknown[] = [];

      if (this.operation === "select") {
        const parsed = parseRelations(this.table, this.selectStr);
        const where = this.buildWhere(params);

        if (this.selectOptions.head && this.selectOptions.count === "exact") {
          const countRows = (await sql(`SELECT COUNT(*)::int AS count FROM ${this.table} ${where}`, params)) as { count: number }[];
          return { data: null, error: null, count: countRows[0]?.count ?? 0 };
        }

        let q = `SELECT ${parsed.relations.length ? "*" : parsed.columns} FROM ${this.table} ${where}`;
        if (this.orderBy) q += ` ORDER BY ${this.orderBy.column} ${this.orderBy.ascending ? "ASC" : "DESC"}`;
        if (this.limitVal !== null) q += ` LIMIT ${this.limitVal}`;
        if (this.offsetVal > 0) q += ` OFFSET ${this.offsetVal}`;

        let rows = (await sql(q, params)) as Row[];
        rows = await attachRelations(rows, parsed.relations);

        if (this.singleResult) return { data: rows[0] ?? null, error: rows[0] ? null : { message: "No rows found" } };
        if (this.maybeSingleResult) return { data: rows[0] ?? null, error: null };
        return { data: rows, error: null };
      }

      if (this.operation === "insert" && this.payload) {
        const records = Array.isArray(this.payload) ? this.payload : [this.payload];
        const results: Row[] = [];
        for (const record of records) {
          const keys = Object.keys(record);
          const values = keys.map((k) => record[k]);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
          const returning = this.returnRows ? " RETURNING *" : "";
          const rows = (await sql(`INSERT INTO ${this.table} (${keys.join(", ")}) VALUES (${placeholders})${returning}`, values)) as Row[];
          if (rows.length) results.push(rows[0]);
        }
        const data = this.singleResult ? results[0] ?? null : Array.isArray(this.payload) ? results : results[0] ?? null;
        return { data, error: null };
      }

      if (this.operation === "update" && this.payload) {
        const data = this.payload as Row;
        const keys = Object.keys(data);
        const setClauses = keys.map((k) => { params.push(data[k]); return `${k} = $${params.length}`; });
        const where = this.buildWhere(params);
        const returning = this.returnRows ? " RETURNING *" : "";
        const rows = (await sql(`UPDATE ${this.table} SET ${setClauses.join(", ")} ${where}${returning}`, params)) as Row[];
        const result = this.singleResult ? rows[0] ?? null : rows;
        return { data: result, error: null };
      }

      if (this.operation === "upsert" && this.payload) {
        const records = Array.isArray(this.payload) ? this.payload : [this.payload];
        const results: Row[] = [];
        const conflictCols = (this.onConflict ?? "id").split(",").map((c) => c.trim()).join(", ");

        for (const record of records) {
          const keys = Object.keys(record);
          const values = keys.map((k) => record[k]);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
          const conflictKeySet = new Set((this.onConflict ?? "id").split(",").map((c) => c.trim()));
          const updates = keys.filter((k) => !conflictKeySet.has(k)).map((k) => `${k} = EXCLUDED.${k}`).join(", ");
          const updateClause = updates || "updated_at = NOW()";
          const returning = this.returnRows ? " RETURNING *" : "";
          const rows = (await sql(
            `INSERT INTO ${this.table} (${keys.join(", ")}) VALUES (${placeholders}) ON CONFLICT (${conflictCols}) DO UPDATE SET ${updateClause}${returning}`,
            values
          )) as Row[];
          if (rows.length) results.push(rows[0]);
        }

        let data: unknown = this.singleResult ? results[0] ?? null : results[0] ?? results;
        if (this.returnRows && results.length && this.selectStr !== "*") {
          const parsed = parseRelations(this.table, this.selectStr);
          if (parsed.relations.length) {
            data = this.singleResult
              ? (await attachRelations([results[0]], parsed.relations))[0]
              : await attachRelations(results, parsed.relations);
          }
        }

        return { data, error: null };
      }

      if (this.operation === "delete") {
        const where = this.buildWhere(params);
        const returning = this.returnRows ? " RETURNING *" : "";
        const rows = (await sql(`DELETE FROM ${this.table} ${where}${returning}`, params)) as Row[];
        return { data: rows, error: null };
      }

      return { data: null, error: { message: "Invalid operation" } };
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : "Database error" } };
    }
  }

  then<TResult1 = { data: unknown; error: { message: string } | null; count?: number | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: { message: string } | null; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export function from(table: string) {
  return new QueryBuilder(table);
}

export async function rpc(fn: string, params: Record<string, unknown>) {
  try {
    const sql = getSql();
    if (fn === "decrease_inventory") {
      const rows = await sql`SELECT decrease_inventory(${params.p_product_id}::uuid, ${params.p_quantity}::int, ${params.p_change_type ?? "sale"}, ${params.p_reference_type ?? null}, ${params.p_reference_id ?? null}::uuid, ${params.p_created_by ?? null}) AS result`;
      return { data: rows[0]?.result, error: null };
    }
    if (fn === "increase_inventory") {
      const rows = await sql`SELECT increase_inventory(${params.p_product_id}::uuid, ${params.p_quantity}::int, ${params.p_change_type ?? "purchase"}, ${params.p_reference_type ?? null}, ${params.p_reference_id ?? null}::uuid, ${params.p_created_by ?? null}) AS result`;
      return { data: rows[0]?.result, error: null };
    }
    if (fn === "archive_old_invoices") {
      const rows = await sql`SELECT archive_old_invoices() AS result`;
      return { data: rows[0]?.result, error: null };
    }
    return { data: null, error: { message: `Unknown RPC: ${fn}` } };
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : "RPC error" } };
  }
}
