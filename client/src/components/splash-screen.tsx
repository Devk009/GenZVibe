
import { motion } from "framer-motion";

export default function SplashScreen() {
  return (
    <motion.div 
      className="fixed inset-0 bg-background flex items-center justify-center z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 2 }}
      exit={{ opacity: 0 }}
    >
      <motion.h1 
        className="font-unbounded text-6xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        vibe
      </motion.h1>
    </motion.div>
  );
}
