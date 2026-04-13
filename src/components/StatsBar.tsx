import { Database, Image, Layers, Copy } from "lucide-react";
import { motion } from "framer-motion";

interface StatsBarProps {
  totalImages: number;
  indexedFolders: number;
  groups: number;
  duplicates: number;
}

const StatsBar = ({ totalImages, indexedFolders, groups, duplicates }: StatsBarProps) => {
  const stats = [
    { icon: Image, label: "Images", value: totalImages, color: "text-primary" },
    { icon: Database, label: "Folders", value: indexedFolders, color: "text-accent" },
    { icon: Layers, label: "Groups", value: groups, color: "text-success" },
    { icon: Copy, label: "Duplicates", value: duplicates, color: "text-warning" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 rounded-lg bg-card border border-border px-4 py-3"
        >
          <stat.icon className={`h-4 w-4 ${stat.color}`} />
          <div>
            <p className="text-lg font-heading font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsBar;
