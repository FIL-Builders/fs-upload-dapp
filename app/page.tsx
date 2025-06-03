"use client";
import { TokenPayment } from "../components/TokenPayment";
import { useAccount } from "wagmi";
import { useState } from "react";
import { ConnectWallet } from "../components/ConnectWallet";
import { FileUploader } from "../components/FileUploader";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "@/components/ui/Confetti";
import { useConfetti } from "@/hooks/useConfetti";

type Tab = "deposit" | "upload";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
};

export default function Home() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>("deposit");
  const { showConfetti } = useConfetti();

  return (
    <>
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
        className="flex flex-col items-center p-8 mt-16"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl font-bold mb-8 text-center text-foreground"
        >
          Demo dApp Powered by synapse-sdk
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-xl font-bold mb-8 text-center text-foreground"
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
                <ConnectWallet />
              </motion.div>
              <motion.p variants={itemVariants} className="mt-8 text-secondary">
                Please connect your wallet to upload dApp
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={itemVariants}
              className="mt-8 w-full max-w-md"
            >
              <motion.div variants={itemVariants} className="flex mb-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("deposit")}
                  className={`flex-1 py-2 px-4 text-center border-b-2 transition-colors ${
                    activeTab === "deposit"
                      ? "border-primary text-primary-foreground bg-primary"
                      : "border-transparent text-secondary hover:text-primary hover:bg-secondary/10"
                  }`}
                >
                  Deposit USDFC
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
              </motion.div>

              <AnimatePresence mode="wait">
                {activeTab === "deposit" ? (
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
                    <TokenPayment />
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                    }}
                  >
                    <FileUploader />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </>
  );
}
