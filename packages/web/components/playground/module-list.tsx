"use client";

import React, { useEffect, useState } from 'react';
import { ModuleComponent } from "library";

export default function ModuleList() {
  const [moduleList, setModuleList] = useState<ModuleComponent[]>([]);

  useEffect(() => {
    async function fetchModuleList() {
      const response = await fetch('/api/modules');
      const data = await response.json();
      setModuleList(data);
    }

    fetchModuleList();
  }, []);

  return (
    <div>
      {moduleList.map((module) => (
        <div key={module.componentName}>{module.componentName}</div>
      ))}
    </div>
  );
}
