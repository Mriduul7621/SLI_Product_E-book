import type { SalesPack } from "@/components/Mastery";

type StoryExtended = {
  setting?: string;
  dialogue?: { speaker: string; text: string }[];
  aside?: string;
  aftermath?: { title: string; text: string };
};

type StoryChapter = {
  chapterId: string;
  setting?: string;
  dialogue?: { speaker: string; text: string }[];
  aside?: string;
  aftermath?: { title: string; text: string };
};

let storyIndex: Record<string, StoryChapter> | null = null;
let packIndex: Record<string, SalesPack> | null = null;

/* Story enrichments are authored per chapter and loaded once. */
import storyData from "@/data/sales/stories.json";
import endowment from "@/data/sales/endowment.json";
import s4pp from "@/data/sales/s4pp.json";
import scep from "@/data/sales/scep.json";
import sspe from "@/data/sales/sspe.json";
import sdpp from "@/data/sales/sdpp.json";
import riders from "@/data/sales/riders.json";
import uwnBasics from "@/data/sales/uwn-basics.json";
import uwnDocs from "@/data/sales/uwn-docs.json";
import uwnHonesty from "@/data/sales/uwn-honesty.json";
import uwnFaReport from "@/data/sales/uwn-fa-report.json";
import uwnGrid from "@/data/sales/uwn-grid.json";

const PACKS = [
  endowment,
  s4pp,
  scep,
  sspe,
  sdpp,
  riders,
  uwnBasics,
  uwnDocs,
  uwnHonesty,
  uwnFaReport,
  uwnGrid,
] as unknown as SalesPack[];

export function storyFor(chapterId: string): StoryExtended | undefined {
  if (!storyIndex) {
    storyIndex = {};
    for (const c of (storyData as { chapters: StoryChapter[] }).chapters) {
      storyIndex[c.chapterId] = c;
    }
  }
  return storyIndex[chapterId];
}

export function salesPackFor(chapterId: string): SalesPack | undefined {
  if (!packIndex) {
    packIndex = {};
    for (const p of PACKS) packIndex[p.chapterId] = p;
  }
  return packIndex[chapterId];
}


