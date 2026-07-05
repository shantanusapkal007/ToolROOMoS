"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ 
        duration: 0.45, // --motion-page
        ease: [0.16, 1, 0.3, 1] // Apple Spring-like easing
      }}
      className="h-full flex flex-col"
    >
      {children}
    </motion.div>
  );
}
