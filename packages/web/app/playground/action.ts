"use server";
import { Component, Module } from "module-toolbox-library";
import fs from "fs";
import path from "path";

export async function getAllModuleDirectoryData(): Promise<Module[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          type: "LocalModule",
          componentName: "Button",
          componentFilePath: "packages/library/src/components/button.tsx",
          componentKey: "Button-packages/library/src/components/button.tsx",
          key: "Button-packages/library/src/components/button.tsx",
        },
      ]);
    }, 1000);
  });
}

export async function getModulesAndComponents(): Promise<{
  modules: Record<string, Module>;
  components: Record<string, Component>;
}> {
  return new Promise((resolve) => {
    fs.readFile(
      path.join(process.cwd(), "../../public/test.json"),
      "utf-8",
      (err, json) => {
        if (err) {
          console.error("读取文件失败", err);
          resolve({
            modules: {},
            components: {},
          });
        }

        const data = JSON.parse(json);
        resolve({
          modules: data.modules || {},
          components: data.components || {},
        });
      }
    );
  });
}
