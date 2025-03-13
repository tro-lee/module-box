import { Fragment, Suspense } from "react";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { SidebarHeader } from "@/components/ui/sidebar";
import ModuleList, {
  ModuleListSkeleton,
} from "@/components/playground/module-list";

export default async function DashboardPage() {
  return (
    <Fragment>
      <ModuleExplorer />
    </Fragment>
  );
}

function ModuleExplorer() {
  return (
    <Sidebar>
      <SidebarHeader>Module-box</SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<ModuleListSkeleton />}>
          <ModuleList />
        </Suspense>
      </SidebarContent>
    </Sidebar>
  );
}
