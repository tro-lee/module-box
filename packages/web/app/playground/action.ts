"use server";

import { ModuleComponent } from "library";

const BASE_URL = "http://localhost:3000";

export async function getAllModuleDirectoryData(): Promise<ModuleComponent[]> {
  const res = await fetch(`${BASE_URL}/modules`);
  const data = await res.json();

  if (data.status !== "success") {
    throw new Error("Failed to fetch modules");
  }

  return data.data;
}
