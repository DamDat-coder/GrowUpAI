import { BaseItem } from "@/types/sidebar";
import Link from "next/link";


interface SidebarItemProps {
  item: BaseItem;
  isExpanded?: boolean; // Chỉ dùng cho Desktop
  onClick?: () => void;
  className?: string;
}

export const SidebarItem = ({ item, isExpanded = true, onClick, className }: SidebarItemProps) => {
  const content = (
    <>
      <div className="min-w-16 h-10 flex items-center justify-center shrink-0">
        {item.icon}
      </div>
      <span className={`text-sm font-medium transition-opacity duration-300 whitespace-nowrap overflow-hidden text-ellipsis mr-4 ${
        isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}>
        {item.label}
      </span>
    </>
  );

  const baseClass = `flex items-center h-12 transition-colors hover:bg-gray-100 dark:hover:bg-white/10 ${className}`;

  if (item.href) {
    return (
      <Link href={item.href} onClick={item.action || onClick} className={`${baseClass} rounded-xl`}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={item.action || onClick} className={`${baseClass} w-full text-left rounded-xl`}>
      {content}
    </button>
  );
};