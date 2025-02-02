import ModuleList, {
  ModuleListSkeleton,
} from "@/components/playground/module-list";
import { Suspense } from "react";
import { getAllModuleDirectoryData } from "./action";
import { ModuleComponent } from "library";

export default async function DashboardPage() {
  // 获取数据的 Promise，可以尽早启动
  const moduleListPromise = getAllModuleDirectoryData();

  return (
    <Suspense fallback={<ModuleListSkeleton />}>
      <ModuleContent promise={moduleListPromise} />
    </Suspense>
  );
}

// 将异步内容分离到子组件
async function ModuleContent({
  promise,
}: {
  promise: Promise<ModuleComponent[]>;
}) {
  const moduleList = await promise;
  return <ModuleList moduleList={moduleList} />;
}
