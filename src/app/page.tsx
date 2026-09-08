"use client";

import GradlyWorkspace from "./components/gradly-workspace";
import WorkspaceInputGuard from "./components/workspace-input-guard";
import WorkspaceProductivity from "./components/workspace-productivity";

export default function Home() {
  return (
    <>
      <GradlyWorkspace />
      <WorkspaceInputGuard />
      <WorkspaceProductivity />
    </>
  );
}
