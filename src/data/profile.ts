import type { ColorId, GarmentType, MaterialId, FitId } from "./catalog";

export interface MyDesign {
  id: string;
  name: string;
  garment: GarmentType;
  color: ColorId;
  material: MaterialId;
  fit: FitId;
  status: "draft" | "published" | "ordered";
  updatedAt: string;
  stats?: { views: number; remixes: number; purchases: number; earnings: number };
}

export const MY_DESIGNS: MyDesign[] = [
  {
    id: "my-midnight-tokyo",
    name: "Midnight Tokyo",
    garment: "hoodie",
    color: "black",
    material: "french-terry",
    fit: "oversized",
    status: "draft",
    updatedAt: "2 days ago",
  },
  {
    id: "my-minimalist-summer",
    name: "Minimalist Summer",
    garment: "tshirt",
    color: "offwhite",
    material: "lightweight-cotton",
    fit: "regular",
    status: "published",
    updatedAt: "1 week ago",
    stats: { views: 1240, remixes: 18, purchases: 6, earnings: 210 },
  },
  {
    id: "my-blackout-hoodie",
    name: "Blackout Hoodie",
    garment: "hoodie",
    color: "black",
    material: "heavyweight-cotton",
    fit: "oversized",
    status: "ordered",
    updatedAt: "3 weeks ago",
  },
  {
    id: "my-quiet-stone",
    name: "Quiet Stone Cap",
    garment: "cap",
    color: "stone",
    material: "tri-blend",
    fit: "regular",
    status: "published",
    updatedAt: "1 month ago",
    stats: { views: 640, remixes: 7, purchases: 2, earnings: 58 },
  },
];
