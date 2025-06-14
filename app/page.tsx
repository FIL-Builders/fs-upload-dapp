"use client";
import { StorageManager } from "../components/StorageManager";
import { useAccount } from "wagmi";
import { useState } from "react";
import { FileUploader } from "../components/FileUploader";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "@/components/ui/Confetti";
import { useConfetti } from "@/hooks/useConfetti";
import { ViewProofSets } from "@/components/ViewProofSets";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type Tab = "manage-storage" | "upload" | "proof-set";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "smooth",
    },
  },
};

export default function Home() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>("manage-storage");
  const { showConfetti } = useConfetti();

  return (
    <div className="w-full flex flex-col justify-center">
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        />
      )}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center p-5 mt-5 w-full mx-auto"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl font-bold mb-3 text-center text-foreground"
        >
          Demo dApp Powered by synapse-sdk
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-xl font-bold mb-3 text-center text-foreground"
        >
          Upload files to Filecoin using PDP
        </motion.p>
        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div
              key="connect"
              variants={itemVariants}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              className="flex flex-col items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ConnectButton />
              </motion.div>
              <motion.p variants={itemVariants} className="mt-3 text-secondary">
                Please connect your wallet to upload dApp
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={itemVariants}
              className="mt-3 max-w-5xl w-full border-1 rounded-lg p-8"
            >
              <motion.div variants={itemVariants} className="flex mb-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("manage-storage")}
                  className={`flex-1 py-2 px-4 text-center border-b-2 transition-colors ${
                    activeTab === "manage-storage"
                      ? "border-primary text-primary-foreground bg-primary"
                      : "border-transparent text-secondary hover:text-primary hover:bg-secondary/10"
                  }`}
                >
                  Manage Storage
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("upload")}
                  className={`flex-1 py-2 px-4 text-center border-b-2 transition-colors ${
                    activeTab === "upload"
                      ? "border-primary text-primary-foreground bg-primary"
                      : "border-transparent text-secondary hover:text-primary hover:bg-secondary/10"
                  }`}
                >
                  Upload File
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("proof-set")}
                  className={`flex-1 py-2 px-4 text-center border-b-2 transition-colors ${
                    activeTab === "proof-set"
                      ? "border-primary text-primary-foreground bg-primary"
                      : "border-transparent text-secondary hover:text-primary hover:bg-secondary/10"
                  }`}
                >
                  View Proof Sets
                </motion.button>
              </motion.div>

              <AnimatePresence mode="wait">
                {activeTab === "manage-storage" ? (
                  <motion.div
                    key="deposit"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                    }}
                  >
                    <StorageManager />
                  </motion.div>
                ) : activeTab === "upload" ? (
                  <motion.div
                    key="upload"
                    // top to bottom
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: +20 }}
                    transition={{
                      type: "smooth",
                    }}
                  >
                    <FileUploader />
                  </motion.div>
                ) : (
                  activeTab === "proof-set" && (
                    <motion.div
                      key="proof-set"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }}
                    >
                      <ViewProofSets />
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  );
}
