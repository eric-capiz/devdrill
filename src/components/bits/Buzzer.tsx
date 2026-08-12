"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Buzzer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`inline-block ${className}`}
      whileHover={{ scale: 1.05, rotate: -1 }}
      whileTap={{ scale: 0.94, rotate: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
    >
      {children}
    </motion.div>
  );
}
