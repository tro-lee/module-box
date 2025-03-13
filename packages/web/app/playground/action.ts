"use server";
import { Module } from "module-toolbox-library";

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
        {
          type: "NodeModule",
          componentName: "Button",
          packageName: "react-button",
          key: "react-button",
        },
      ]);
    }, 1000);
  });
}
