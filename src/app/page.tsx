"use client";

import GradlyWorkspace from "./components/gradly-workspace";
import WorkspaceInputGuard from "./components/workspace-input-guard";

export default function Home() {
  return (
    <>
      <GradlyWorkspace />
      <WorkspaceInputGuard />
    </>
  );
}
