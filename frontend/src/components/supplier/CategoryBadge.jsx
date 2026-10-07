import {
  Pill, Sparkles, Baby, Droplets, Syringe, FlaskConical,
  BandageIcon, Droplet, Heart, Eye, Star, Leaf,
  Dumbbell, HeartHandshake, Package,
} from 'lucide-react';
import { CATEGORIES } from '../../data/categories';

export const CATEGORY_ICONS = {
  'medicine':     Pill,
  'skincare':     Sparkles,
  'baby':         Baby,
  'vitamins':     Droplets,
  'pain-relief':  Syringe,
  'antibiotics':  FlaskConical,
  'first-aid':    BandageIcon,
  'diabetes':     Droplet,
  'heart':        Heart,
  'eye-care':     Eye,
  'dental':       Star,
  'herbal':       Leaf,
  'supplements':  Dumbbell,
  'baby-mother':  HeartHandshake,
  'other':        Package,
};

const CategoryBadge = ({ value }) => {
  const match = CATEGORIES.find(
    (c) => c.id === value || c.name === value,
  );
  const IconComponent = match ? (CATEGORY_ICONS[match.id] || Package) : Package;
  const label = match ? match.name : value;

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
      <IconComponent size={14} className="text-slate-400" />
      {label}
    </span>
  );
};

export default CategoryBadge;