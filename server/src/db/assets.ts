import { db } from "./connection.js";
import type { Asset } from "../types.js";

export async function getAssets(): Promise<Asset[]> {
  const rows = await db.all<any>(
    "SELECT * FROM assets ORDER BY created_at DESC",
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    subtype: row.subtype,
    url: row.url || "",
    size: row.size || "",
    date: row.date || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getAsset(id: string): Promise<Asset | null> {
  const row = await db.get<any>("SELECT * FROM assets WHERE id = ?", [id]);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    subtype: row.subtype,
    url: row.url || "",
    size: row.size || "",
    date: row.date || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveAsset(asset: Asset): Promise<void> {
  const existing = await getAsset(asset.id);

  if (existing) {
    // Update
    await db.run(
      `UPDATE assets
       SET name = ?, type = ?, subtype = ?, url = ?, size = ?, date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        asset.name,
        asset.type,
        asset.subtype,
        asset.url,
        asset.size,
        asset.date,
        asset.id,
      ],
    );
  } else {
    // Insert
    await db.run(
      `INSERT INTO assets (id, name, type, subtype, url, size, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        asset.id,
        asset.name,
        asset.type,
        asset.subtype,
        asset.url,
        asset.size,
        asset.date,
      ],
    );
  }
}

export async function deleteAsset(id: string): Promise<void> {
  await db.run("DELETE FROM assets WHERE id = ?", [id]);
}
