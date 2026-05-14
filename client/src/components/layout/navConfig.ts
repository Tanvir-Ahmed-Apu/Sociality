import { House, User, Chat, Bell, Gear, MagnifyingGlass } from "phosphor-react";

export interface NavItemConfig {
  icon: any;
  label: string;
  to: string;
  mobile: boolean;
}

export const getNavItems = (username?: string): NavItemConfig[] => [
  { icon: House, label: "Home", to: "/", mobile: true },
  { icon: MagnifyingGlass, label: "Search", to: "/search", mobile: true },
  { icon: Bell, label: "Notifications", to: "/notifications", mobile: true },
  { icon: Chat, label: "Messages", to: "/chat", mobile: true },
  { icon: User, label: "Profile", to: `/${username || "profile"}`, mobile: true },
  { icon: Gear, label: "Settings", to: "/settings", mobile: true },
];

export const isPathActive = (path: string, currentPath: string, username?: string) => {
  if (path === "/") return currentPath === "/";
  if (path.includes("profile") || (username && path === `/${username}`)) {
     // Handle both generic profile path and actual username path
     return currentPath === `/${username}` || currentPath === "/profile";
  }
  return currentPath.startsWith(path);
};
