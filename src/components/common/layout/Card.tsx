import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm p-8",
        "flex flex-col items-center gap-6",
        "min-w-[400px] max-w-2xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};
