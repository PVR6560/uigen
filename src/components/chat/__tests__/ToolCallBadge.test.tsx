import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { ToolCallBadge } from "../ToolCallBadge";
import { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: ToolInvocation["state"] = "result"
): ToolInvocation {
  if (state === "result") {
    return { toolCallId: "1", toolName, args, state, result: "ok" } as ToolInvocation;
  }
  return { toolCallId: "1", toolName, args, state } as ToolInvocation;
}

describe("ToolCallBadge", () => {
  it('str_replace_editor + create → "Creating /App.jsx"', () => {
    render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" })} />);
    expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  });

  it('str_replace_editor + str_replace → "Editing /components/Card.jsx"', () => {
    render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" })} />);
    expect(screen.getByText("Editing /components/Card.jsx")).toBeDefined();
  });

  it('str_replace_editor + insert → "Editing /App.jsx"', () => {
    render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "/App.jsx" })} />);
    expect(screen.getByText("Editing /App.jsx")).toBeDefined();
  });

  it('str_replace_editor + view → "Viewing /App.jsx"', () => {
    render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "/App.jsx" })} />);
    expect(screen.getByText("Viewing /App.jsx")).toBeDefined();
  });

  it('str_replace_editor + undo_edit → "Undoing edit to /App.jsx"', () => {
    render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })} />);
    expect(screen.getByText("Undoing edit to /App.jsx")).toBeDefined();
  });

  it('file_manager + rename → "Renaming /old.jsx"', () => {
    render(<ToolCallBadge toolInvocation={makeInvocation("file_manager", { command: "rename", path: "/old.jsx" })} />);
    expect(screen.getByText("Renaming /old.jsx")).toBeDefined();
  });

  it('file_manager + delete → "Deleting /old.jsx"', () => {
    render(<ToolCallBadge toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/old.jsx" })} />);
    expect(screen.getByText("Deleting /old.jsx")).toBeDefined();
  });

  it("unknown tool name → renders raw tool name", () => {
    render(<ToolCallBadge toolInvocation={makeInvocation("some_unknown_tool", {})} />);
    expect(screen.getByText("some_unknown_tool")).toBeDefined();
  });

  it('state === "result" → shows green dot, not spinner', () => {
    const { container } = render(
      <ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result")} />
    );
    expect(container.querySelector(".bg-emerald-500")).toBeDefined();
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it('state === "call" → shows spinner, not green dot', () => {
    const { container } = render(
      <ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "call")} />
    );
    expect(container.querySelector(".animate-spin")).toBeDefined();
    expect(container.querySelector(".bg-emerald-500")).toBeNull();
  });
});
