import { Suspense } from "react";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { SidebarHeader } from "@/components/ui/sidebar";
import ModuleListComponent, {
  ModuleListSkeleton,
} from "@/components/playground/module-list";
import ModuleGraphComponent, {
  ModuleGraphSkeleton,
} from "@/components/playground/module-graph/module-graph";
import { getModulesAndComponents } from "./action";

export default async function DashboardPage() {
  return (
    <div className="h-full w-full flex">
      <ModuleExplorer />
      <Suspense fallback={<ModuleGraphSkeleton />}>
        <ModuleGraph />
      </Suspense>
    </div>
  );
}

function ModuleExplorer() {
  return (
    <Sidebar>
      <SidebarHeader>Module-box</SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<ModuleListSkeleton />}>
          <ModuleListComponent
            promise={
              new Promise((resolve) => {
                setTimeout(() => {
                  resolve(1);
                }, 2000);
              })
            }
          />
        </Suspense>
      </SidebarContent>
    </Sidebar>
  );
}

function ModuleGraph() {
  const promise = getModulesAndComponents();
  return (
    <div className="flex-1">
      <ModuleGraphComponent promise={promise} />
    </div>
  );
}
