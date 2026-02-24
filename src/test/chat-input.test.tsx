import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatInput } from "@/components/chat/ChatInput";

describe("ChatInput", () => {
  it("sends and clears message on enter", () => {
    const onSend = vi.fn();

    render(<ChatInput onSend={onSend} />);

    const input = screen.getByPlaceholderText("Type your message...");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onSend).toHaveBeenCalledWith("hello");
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("does not send when disabled", () => {
    const onSend = vi.fn();

    render(<ChatInput onSend={onSend} disabled />);

    const input = screen.getByPlaceholderText("Type your message...");
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onSend).not.toHaveBeenCalled();
  });
});
