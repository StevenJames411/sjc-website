import React from "react";
import {
  Phone, PhoneCall, Calendar, CalendarCheck, CalendarDays, Clock, Star, MapPin, Mail,
  MessageCircle, ArrowRight, Check, CheckCircle2, BadgeCheck, ShieldCheck, Sparkles, Heart,
  HeartHandshake, ThumbsUp, Award, Trophy, Users, Home, Camera, Truck, Wrench, Hammer, Ruler,
  Leaf, Sun, Droplet, Bath, ShowerHead, Wind, Scissors, PawPrint, Bone, Dog, Cat, Bird, Bug,
  Sofa, Fence, TreePine, Flame, Snowflake, Zap, Car, Sparkle, Brush, Wallet, DollarSign,
  CreditCard, FileText, Smile, Gift, Tag, Percent, Store, Building2, Navigation, Send,
  BrainCircuit, Code, CodeXml, LifeBuoy, Lock, Menu, MousePointerClick, Palette, Rocket, Search, Smartphone, TrendingUp, LayoutGrid, Globe, BarChart3,
  type LucideIcon,
} from "lucide-react";

// The site's icon set.
//
// These are LUCIDE icons, installed as an npm package and bundled at build time.
//
// Two earlier attempts were both wrong, and it's worth recording why:
//   1. The design we ported loaded lucide from unpkg at "@latest" — a live dependency on
//      somebody else's server inside a paying client's website. If it goes down, every site we
//      have built loses its icons at once and we hear about it from the client.
//   2. So the first version here was hand-drawn SVG paths. No CDN, but they looked hand-drawn —
//      the "bone" was unrecognisable. Avoiding a bad dependency by doing worse work is not a
//      trade; it just moves the problem somewhere the client can see it.
//
// A bundled package is both: professionally drawn AND no runtime dependency on anyone. Lucide is
// ISC-licensed, which permits commercial use and redistribution.
//
// The list below is CURATED on purpose — lucide ships ~6,000 icons and a dropdown with 6,000
// entries is unusable. These are the ones a service business actually needs. Adding one is an
// import plus a line in ICONS; the builder's dropdown is generated from this object.
//
// Keys stay kebab-case ("map-pin", not "MapPin") because pages already saved in the database
// reference them that way.

export const ICONS: Record<string, LucideIcon> = {
  // contact + booking
  phone: Phone,
  "phone-call": PhoneCall,
  calendar: Calendar,
  "calendar-check": CalendarCheck,
  "calendar-days": CalendarDays,
  clock: Clock,
  mail: Mail,
  message: MessageCircle,
  "map-pin": MapPin,
  navigation: Navigation,
  send: Send,
  "arrow-right": ArrowRight,

  // trust + proof
  star: Star,
  check: Check,
  "check-circle": CheckCircle2,
  "badge-check": BadgeCheck,
  shield: ShieldCheck,
  award: Award,
  trophy: Trophy,
  "thumbs-up": ThumbsUp,
  users: Users,
  smile: Smile,
  heart: Heart,
  "heart-handshake": HeartHandshake,

  // pets + grooming
  paw: PawPrint,
  bone: Bone,
  dog: Dog,
  cat: Cat,
  bird: Bird,
  scissors: Scissors,
  brush: Brush,
  bath: Bath,
  "shower-head": ShowerHead,
  droplet: Droplet,
  wind: Wind,
  sparkles: Sparkles,
  sparkle: Sparkle,

  // trades + home services
  wrench: Wrench,
  hammer: Hammer,
  ruler: Ruler,
  fence: Fence,
  sofa: Sofa,
  home: Home,
  "tree-pine": TreePine,
  leaf: Leaf,
  sun: Sun,
  flame: Flame,
  snowflake: Snowflake,
  zap: Zap,
  car: Car,
  truck: Truck,
  bug: Bug,

  // money + business
  wallet: Wallet,
  "dollar-sign": DollarSign,
  "credit-card": CreditCard,
  "file-text": FileText,
  gift: Gift,
  tag: Tag,
  percent: Percent,
  store: Store,
  building: Building2,
  camera: Camera,

  // ── ADDED 2026-07-31, from importing a bought design ────────────────────────────────────
  // A generated design reaches for generic UI icons, not trade icons — the curated set was
  // all trades (paw, bone, hammer) and matched 8 of the 23 this design used, so two thirds of
  // its cards imported with no icon at all. These are the ones any business page wants.
  "brain-circuit": BrainCircuit,
  "code": Code,
  "code-xml": CodeXml,
  "life-buoy": LifeBuoy,
  "lock": Lock,
  "menu": Menu,
  "mouse-pointer-click": MousePointerClick,
  "palette": Palette,
  "rocket": Rocket,
  "search": Search,
  "smartphone": Smartphone,
  "trending-up": TrendingUp,
  "layout-grid": LayoutGrid,
  "globe": Globe,
  "bar-chart-3": BarChart3,

  // Legacy lucide names a design may still emit. Lucide renamed these; the generator hasn't
  // caught up, and an icon that silently doesn't render is worse than one that's approximate.
  "check-circle-2": CheckCircle2,
  "code-2": CodeXml,
  "shield-check": ShieldCheck,
};

export const ICON_NAMES = Object.keys(ICONS).sort();

// Options for a Puck select field — generated, so adding an icon above is the only step.
export const ICON_OPTIONS = [
  { label: "None", value: "" },
  ...ICON_NAMES.map((n) => ({ label: n.replace(/-/g, " "), value: n })),
];

export default function Icon({
  name,
  size = 18,
  className = "",
  style,
  strokeWidth = 2,
}: {
  name?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}) {
  const Cmp = name ? ICONS[name] : undefined;
  if (!Cmp) return null;
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden
    />
  );
}
