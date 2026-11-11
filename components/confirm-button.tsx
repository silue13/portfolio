"use client";

import type { ReactNode } from "react";

export default function ConfirmButton({
  message,
  title,
  className,
  children,
}: {
  message: string;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      title={title}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
