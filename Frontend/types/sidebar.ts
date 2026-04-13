import { IUser } from "./auth";

export interface BaseItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  className?: string;
}
// Dùng chung cho cả 2 loại Sidebar
export interface SharedSidebarProps {
  items: BaseItem[];
  user: IUser | null;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

// Chỉ dành riêng cho Mobile
export interface MobileSidebarProps extends SharedSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  logout: () => void;
  onOpenAuth: () => void;
}
