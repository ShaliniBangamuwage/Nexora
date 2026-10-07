import {
  LayoutGrid, Activity, Apple, Baby, Eye, Ear, Sun, Heart,
  Bone, Brain, Droplets, Shield, Thermometer, Syringe,
  Leaf, Microscope, Smile, Dumbbell, Wind, Bandage,
  HandHeart, FlaskConical, Star, Stethoscope, Pill,
} from "lucide-react";

const ICON_MAP = [
  { match: ["all"],                                         Icon: LayoutGrid    },
  { match: ["pain", "relief"],                              Icon: Activity      },
  { match: ["vitamin", "supplement"],                       Icon: Apple         },
  { match: ["baby", "infant", "child"],                     Icon: Baby          },
  { match: ["eye", "vision"],                               Icon: Eye           },
  { match: ["ear"],                                         Icon: Ear           },
  { match: ["skin", "derma", "cream"],                      Icon: Sun           },
  { match: ["heart", "cardiac"],                            Icon: Heart         },
  { match: ["bone", "joint", "ortho"],                      Icon: Bone          },
  { match: ["brain", "neuro", "mental"],                    Icon: Brain         },
  { match: ["diabetes", "sugar", "blood"],                  Icon: Droplets      },
  { match: ["antibiotic", "infection"],                     Icon: Shield        },
  { match: ["cold", "flu", "fever", "cough"],               Icon: Thermometer   },
  { match: ["injection", "vaccine"],                        Icon: Syringe       },
  { match: ["herbal", "natural", "ayur"],                   Icon: Leaf          },
  { match: ["lab", "test", "diagnostic"],                   Icon: Microscope    },
  { match: ["dental", "oral", "tooth"],                     Icon: Smile         },
  { match: ["fitness", "sport", "protein"],                 Icon: Dumbbell      },
  { match: ["breath", "lung", "respir", "asthma"],          Icon: Wind          },
  { match: ["wound", "first aid", "bandage"],               Icon: Bandage       },
  { match: ["care", "wellness"],                            Icon: HandHeart     },
  { match: ["generic", "pharma"],                           Icon: FlaskConical  },
  { match: ["special", "premium"],                          Icon: Star          },
  { match: ["doctor", "clinic"],                            Icon: Stethoscope   },
];

// Returns the Icon component class — render in .jsx like: const Icon = getCategoryIcon(name); <Icon size={14} />
export function getCategoryIcon(name = "") {
  const n     = name.toLowerCase();
  const found = ICON_MAP.find(({ match }) => match.some((m) => n.includes(m)));
  return found?.Icon ?? Pill;
}

export const C = {
  bg:          "var(--bg-primary)",
  surface:     "var(--bg-secondary)",
  border:      "var(--navbar-border)",
  accent:      "var(--accent-blue)",
  accentDark:  "var(--text-primary)",
  textPrimary: "var(--text-primary)",
  textMuted:   "var(--text-secondary)",
  textSoft:    "var(--text-secondary)",
};

export const FONT = {
  display: "'Playfair Display', serif",
  body:    "'DM Sans', sans-serif",
};