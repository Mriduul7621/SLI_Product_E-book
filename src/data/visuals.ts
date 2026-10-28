/**
 * Visual storytelling layer for the e-book.
 * Each chapter opens with a scene illustration that mirrors its story,
 * keeping the Shanta Life palette (olive / sunset orange / charcoal).
 */

export type Visual = {
  src: string;
  alt: string;
  caption: string;
  /** Short label used on contents cards */
  label: string;
};

export const coverVisual: Visual = {
  src: "/assets/img/cover-art.jpg",
  alt: "সূর্যোদয়ের আলোয় পিতা-মাতা ও সন্তানের হাতে হাত — সুরক্ষার প্রতীক",
  caption: "সুরক্ষা ও আগামীর প্রতিশ্রুতি",
  label: "প্রচ্ছদ",
};

export const introVisual: Visual = {
  src: "/assets/img/scene-intro.jpg",
  alt: "শান্তা লাইফের প্রশিক্ষণ কক্ষে ট্রেইনার ও ফিল্ড অফিসারদের আলোচনা",
  caption: "মাঠ পর্যায়ের প্রশিক্ষণই তৈরি করে আত্মবিশ্বাসী কনসালট্যান্ট",
  label: "প্রশিক্ষণ",
};

export const frameworkVisual: Visual = {
  src: "/assets/img/sli-family-photo.jpg",
  alt: "সবুজ মাঠে সন্তানের সঙ্গে হাঁটা পিতা — পারিবারিক সুরক্ষার প্রতিচ্ছবি",
  caption: "প্রতিটি পলিসির পেছনে থাকে একটি পরিবারের ভরসা",
  label: "পরিবার",
};

export const closingVisual: Visual = {
  src: "/assets/img/scene-scep.jpg",
  alt: "স্বপ্নের ক্যাম্পাসের পথে সন্তান ও অভিভাবক",
  caption: "আজকের সঠিক পরামর্শই আগামীর নিশ্চিত ভবিষ্যৎ",
  label: "ভবিষ্যৎ",
};

export const chapterVisuals: Record<string, Visual> = {
  endowment: {
    src: "/assets/img/scene-endowment.jpg",
    alt: "কর্পোরেট ম্যানেজারের সঙ্গে সেলস অফিসারের বৈঠক, পেছনে গ্রোথ ও সুরক্ষার প্রতীক",
    caption: "মেয়াদ শেষে নিশ্চিত মূলধন, মেয়াদজুড়ে পরিবারের নিরাপত্তা",
    label: "এন্ডোমেন্ট",
  },
  s4pp: {
    src: "/assets/img/scene-s4pp.jpg",
    alt: "শোরুমে ব্যবসায়ীর সঙ্গে ফাইন্যান্সিয়াল কনসালট্যান্ট, পেছনে চার ধাপের কিস্তির সময়রেখা",
    caption: "মেয়াদের মাঝেই তারল্য — চার ধাপে বীমাঙ্কের অর্থ",
    label: "ফোর পেমেন্ট",
  },
  scep: {
    src: "/assets/img/scene-scep.jpg",
    alt: "সন্তানকে বিদ্যালয়ের পথে নিয়ে যাওয়া অভিভাবক, চারপাশে সুরক্ষা-বলয়",
    caption: "পিতামাতার অবর্তমানেও থেমে থাকে না সন্তানের পড়াশোনা",
    label: "শিক্ষা পরিকল্পনা",
  },
  sspe: {
    src: "/assets/img/scene-sspe.jpg",
    alt: "বাগানে বিশ্রামরত অবসরপ্রাপ্ত গ্রাহক ও কনসালট্যান্ট, এককালীন বিনিয়োগের প্রতীক",
    caption: "একবারের বিনিয়োগে দীর্ঘমেয়াদি নিশ্চিন্ততা",
    label: "সিঙ্গেল প্রিমিয়াম",
  },
  sdpp: {
    src: "/assets/img/scene-sdpp.jpg",
    alt: "আধুনিক অফিসে তরুণ উদ্যোক্তা ও ব্রাঞ্চ লিড, পাশে স্বাস্থ্য সুরক্ষার প্রতীক",
    caption: "নমনীয় সঞ্চয় আর স্বাস্থ্য সুরক্ষা — একই পলিসিতে",
    label: "ইউনিভার্সাল লাইফ",
  },
  riders: {
    src: "/assets/img/scene-riders.jpg",
    alt: "বিস্তৃত সুরক্ষা-ছাতার নিচে দাঁড়ানো পরিবার",
    caption: "সঠিক রাইডার যুক্ত করলেই ৩৬০-ডিগ্রি সুরক্ষা বলয়",
    label: "রাইডার",
  },
  "uwn-basics": {
    src: "/assets/img/scene-uwn-basics.jpg",
    alt: "ব্রাঞ্চ অফিসে তরুণ সেলস অফিসার ও ইউনিট ম্যানেজার, পেছনে আন্ডাররাইটিংয়ের ম্যাগনিফাইং গ্লাস ও সুরক্ষার ঢাল",
    caption: "প্রস্তাব জমা মানেই পলিসি নয় — আগে আসে ঝুঁকির যাচাই",
    label: "আন্ডাররাইটিং",
  },
  "uwn-docs": {
    src: "/assets/img/scene-uwn-docs.jpg",
    alt: "আন্ডাররাইটিং কাউন্টারে ফাইন্যান্সিয়াল অ্যাসোসিয়েট ও অফিসার, সামনে পরিচয়পত্র, জন্ম নিবন্ধন ও ছবির ফাইল",
    caption: "সঠিক নথি জমা দিলেই দ্রুত অনুমোদন",
    label: "প্রয়োজনীয় নথি",
  },
  "uwn-honesty": {
    src: "/assets/img/scene-uwn-honesty.jpg",
    alt: "বসার ঘরে গ্রাহকের সঙ্গে এজেন্ট, পাশে ম্যানেজার কলম থামিয়ে দিচ্ছেন; পেছনে ওষুধ ও স্বাস্থ্য প্রতীক",
    caption: "সত্য তথ্যই দাবির সময় পরিবারের আসল সুরক্ষা",
    label: "সততা",
  },
  "uwn-fa-report": {
    src: "/assets/img/scene-uwn-fa-report.jpg",
    alt: "এফএ রিপোর্ট হাতে তরুণ এজেন্ট ও ইউনিট ম্যানেজারের পরামর্শ, পেছনে ব্যবসায়ী গ্রাহক",
    caption: "এজেন্টই কোম্পানির প্রথম ফিল্ড আন্ডাররাইটার",
    label: "এফএ রিপোর্ট",
  },
  "uwn-grid": {
    src: "/assets/img/scene-uwn-grid.jpg",
    alt: "মেডিকেল গ্রিড চার্ট হাতে ইউনিট ম্যানেজার ও ফাইন্যান্সিয়াল অ্যাসোসিয়েট, চারপাশে টেস্টের প্রতীক",
    caption: "বয়স ও বীমাঙ্ক মিলিয়ে এক নজরে সঠিক টেস্টের তালিকা",
    label: "মেডিকেল গ্রিড",
  },
};

export const fieldPhotos = [
  {
    src: "/assets/img/field-training-1.jpg",
    alt: "শান্তা লাইফের প্রশিক্ষণ কক্ষে ফিল্ড অফিসারদের অংশগ্রহণ",
    caption: "প্রোডাক্ট ওয়ার্কশপ — মাঠের প্রশ্নের সরাসরি উত্তর",
  },
  {
    src: "/assets/img/field-training-2.jpg",
    alt: "ফিল্ড ফোর্সের সঙ্গে প্রোডাক্ট ব্রিফিং সেশন",
    caption: "ফিল্ড ব্রিফিং — অভিজ্ঞতা থেকে শেখা",
  },
];

export function visualFor(chapterId: string): Visual | undefined {
  return chapterVisuals[chapterId];
}
