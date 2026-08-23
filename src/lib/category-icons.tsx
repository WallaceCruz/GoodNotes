import {
  Activity,
  Apple,
  Baby,
  Bed,
  Briefcase,
  Bus,
  Car,
  Dumbbell,
  Flower2,
  Gamepad2,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  Laptop,
  Leaf,
  Lightbulb,
  Moon,
  Palette,
  PiggyBank,
  Pill,
  Plane,
  Smartphone,
  SprayCan,
  Star,
  Tag,
  Target,
  TreePine,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/** Catálogo de ícones disponíveis para categorias. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  home: Home,
  briefcase: Briefcase,
  book: GraduationCap,
  lotus: Flower2,
  run: Dumbbell,
  apple: Apple,
  sleep: Moon,
  pill: Pill,
  users: Users,
  heart: Heart,
  family: Baby,
  cart: Wallet,
  car: Car,
  money: PiggyBank,
  clean: SprayCan,
  palette: Palette,
  game: Gamepad2,
  phone: Smartphone,
  tree: TreePine,
  bed: Bed,
  leaf: Leaf,
  laptop: Laptop,
  plane: Plane,
  bus: Bus,
  target: Target,
  idea: Lightbulb,
  star: Star,
  pulse: Activity,
  health: HeartPulse,
  tag: Tag,
};

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS);

export function CategoryIcon({
  name,
  className,
}: {
  name: string | undefined;
  className?: string;
}) {
  const Icon = (name && CATEGORY_ICONS[name]) || Tag;
  return <Icon className={className} aria-hidden />;
}
