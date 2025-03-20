"use client";
"use module";

import { Fragment, use } from "react";
import { Folder, Tree, File } from "../ui/file-tree";
import { Skeleton } from "../ui/skeleton";

export function ModuleListSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Fragment key={index}>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" /> {/* 文件夹图标骨架 */}
            <Skeleton className="h-4 w-24" /> {/* 文件夹名称骨架 */}
          </div>
          <div className="pl-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" /> {/* 文件图标骨架 */}
              <Skeleton className="h-4 w-24" /> {/* 文件名骨架 */}
            </div>
          </div>
          <div className="pl-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" /> {/* 文件图标骨架 */}
              <Skeleton className="h-4 w-24" /> {/* 文件名骨架 */}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

// 模块列表 用于展示模块资源信息
export default function ModuleListComponent({
  promise,
}: {
  promise: Promise<number>;
}) {
  use(promise);
  return (
    <Tree
      className="p-2 overflow-hidden rounded-md"
      initialSelectedId="7"
      initialExpandedItems={[
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
      ]}
      elements={ELEMENTS}
    >
      <Folder element="src" value="1">
        <Folder value="2" element="app">
          <File value="3">
            <p>layout.tsx</p>
          </File>
          <File value="4">
            <p>page.tsx</p>
          </File>
        </Folder>
        <Folder value="5" element="components">
          <Folder value="6" element="ui">
            <File value="7">
              <p>button.tsx</p>
            </File>
          </Folder>
          <File value="8">
            <p>header.tsx</p>
          </File>
          <File value="9">
            <p>footer.tsx</p>
          </File>
        </Folder>
        <Folder value="10" element="lib">
          <File value="11">
            <p>utils.ts</p>
          </File>
        </Folder>
      </Folder>
    </Tree>
  );
}

const ELEMENTS = [
  {
    id: "1",
    isSelectable: true,
    name: "src",
    children: [
      {
        id: "2",
        isSelectable: true,
        name: "app",
        children: [
          {
            id: "3",
            isSelectable: true,
            name: "layout.tsx",
          },
          {
            id: "4",
            isSelectable: true,
            name: "page.tsx",
          },
        ],
      },
      {
        id: "5",
        isSelectable: true,
        name: "components",
        children: [
          {
            id: "6",
            isSelectable: true,
            name: "header.tsx",
          },
          {
            id: "7",
            isSelectable: true,
            name: "footer.tsx",
          },
        ],
      },
      {
        id: "8",
        isSelectable: true,
        name: "lib",
        children: [
          {
            id: "9",
            isSelectable: true,
            name: "utils.ts",
          },
        ],
      },
    ],
  },
];
