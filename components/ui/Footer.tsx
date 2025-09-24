import { motion } from "framer-motion";
import Link from "next/link";
import Github from "./icons/Github";
import Filecoin from "./icons/Filecoin";

export default function Footer() {
  const footerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const heartAnimation = {
    scale: [1, 1.2, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  return (
    <motion.footer
      variants={footerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="flex w-full items-center justify-center rounded-t-lg border-t"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
        color: "var(--foreground)",
      }}
    >
      <motion.div
        variants={itemVariants}
        className="mx-auto px-4 py-6 sm:px-6 md:px-24 lg:px-8 w-full"
      >
        <motion.div
          variants={footerVariants}
          className="flex flex-col items-center gap-4 sm:gap-5 max-w-4xl mx-auto"
        >
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-2 sm:gap-3 text-center"
          >
            <motion.h1
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="text-lg sm:text-2xl md:text-3xl font-bold uppercase tracking-tighter flex items-center gap-1 sm:gap-2"
            >
              <Filecoin />
              <span className="hidden sm:inline">
                Filecoin onchain cloud demo
              </span>
              <span className="sm:hidden">Filecoin Demo</span>
            </motion.h1>
          </motion.div>
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="touch-manipulation"
          >
            <Link
              className="text-center text-base sm:text-xl font-semibold transition-colors duration-200 flex items-center gap-1 sm:gap-2 p-2 rounded-lg"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              href="https://github.com/FIL-Builders/fs-upload-dapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="hidden sm:inline">Fork me</span>
              <span className="sm:hidden">Fork</span>
              <Github />
            </Link>
          </motion.div>
          <motion.p
            variants={itemVariants}
            className="text-center text-sm sm:text-lg"
          >
            <span className="hidden sm:inline">Build with </span>
            <span className="sm:hidden">Made with </span>
            <motion.span
              animate={heartAnimation}
              className="inline-block"
              style={{ color: "#ef4444" }}
            >
              ❤️
            </motion.span>{" "}
            for everyone
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.footer>
  );
}
