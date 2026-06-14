import {
  Bike,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  Code,
  Coffee,
  DollarSign,
  Dumbbell,
  Film,
  Flag,
  Folder,
  Gamepad2,
  Globe,
  GraduationCap,
  Hammer,
  Headphones,
  Heart,
  House,
  Leaf,
  Lightbulb,
  type LucideIcon,
  Music,
  Palette,
  PenTool,
  Plane,
  Rocket,
  ShoppingCart,
  Smile,
  Sprout,
  Star,
  Target,
  Trophy,
  Utensils,
  Zap,
} from "lucide-react";

/** Catálogo curado de iconos para workspaces. La clave es el nombre que se guarda en DB. */
export const WORKSPACE_ICONS: Record<string, LucideIcon> = {
  Briefcase,
  House,
  Dumbbell,
  Code,
  Rocket,
  Target,
  BookOpen,
  GraduationCap,
  Heart,
  Star,
  ShoppingCart,
  Plane,
  Music,
  Camera,
  Palette,
  Coffee,
  Gamepad2,
  Leaf,
  Lightbulb,
  CalendarDays,
  Folder,
  Flag,
  Trophy,
  Hammer,
  PenTool,
  Globe,
  DollarSign,
  Brain,
  Zap,
  Bike,
  Utensils,
  Film,
  Headphones,
  Building2,
  Sprout,
  Smile,
};

export const WORKSPACE_ICON_NAMES = Object.keys(WORKSPACE_ICONS);

/**
 * Renderiza el icono de un workspace por nombre.
 * - Si el nombre está en el catálogo → icono Lucide teñido con el color.
 * - Si es un valor antiguo (emoji) → lo muestra como texto (compatibilidad).
 * - Si no hay nada → un punto del color del workspace.
 */
export function WorkspaceIcon({
  name,
  color,
  className = "h-4 w-4",
}: {
  name?: string | null;
  color: string;
  className?: string;
}) {
  if (name && name in WORKSPACE_ICONS) {
    const Icon = WORKSPACE_ICONS[name];
    return <Icon className={className} style={{ color }} />;
  }
  if (name) {
    return <span className="text-base leading-none">{name}</span>;
  }
  return <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />;
}
