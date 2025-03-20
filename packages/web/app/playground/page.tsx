import { Suspense } from "react";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { SidebarHeader } from "@/components/ui/sidebar";
import ModuleListComponent, {
  ModuleListSkeleton,
} from "@/components/playground/module-list";
import ModuleGraphComponent from "@/components/playground/module-graph";

export default async function DashboardPage() {
  return (
    <div className="h-full w-full flex">
      <ModuleExplorer />
      <ModuleGraph />
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
  return (
    <div className="flex-1">
      <ModuleGraphComponent />
    </div>
  );
}
