import { ModuleComponent } from "library";
import { Skeleton } from "../ui/skeleton";

interface ModuleListProps {
  moduleList: ModuleComponent[];
}

export default function ModuleList({ moduleList }: ModuleListProps) {
  return (
    <div>
      {moduleList.map((module) => (
        <div key={module.componentName}>{module.componentName}</div>
      ))}
    </div>
  );
}

export function ModuleListSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}
