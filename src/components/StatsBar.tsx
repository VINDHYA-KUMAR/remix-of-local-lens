import { Image, Database, Layers, Cloud } from "lucide-react";
import { motion } from "framer-motion";

interface StatsBarProps {
  totalImages: number;
  indexedFolders: number;
  groups: number;
  duplicates: number;
}

const StatsBar = ({ totalImages, groups }: StatsBarProps) => {
  const stats = [
    { icon: Image, label: "Total Images", value: totalImages, color: "text-primary" },
    { icon: Layers, label: "AI Analyzed", value: groups, color: "text-success" },
    { icon: Cloud, label: "Storage", value: "Cloud", color: "text-accent" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
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
