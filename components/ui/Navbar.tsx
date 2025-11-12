"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ThemeToggle } from "./ThemeToggle";
import { motion } from "framer-motion";
import Image from "next/image";

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="flex items-center justify-between px-3 py-3  border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4 min-w-0 flex-1 mb-2 sm:mb-0 w-full"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1 ml-4 sm:ml-0"
        >
          <Image
            src="/filecoin.svg"
            alt="Filecoin"
            width={24}
            height={24}
            className="w-[30px] h-[30px] shrink-0"
          />
          <h1 className="text-sm sm:text-xl font-bold truncate flex-col items-center text-left lg:flex hidden">
            Filecoin Onchain Cloud dApp
          </h1>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 shrink-0 w-full justify-end"
      >
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <ThemeToggle />
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <ConnectButton
            showBalance={false}
            accountStatus="avatar"
            chainStatus="icon"
          />
        </motion.div>
      </motion.div>
    </motion.nav>
  );
}
