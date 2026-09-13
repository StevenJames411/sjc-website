"use client";
// One block, two doors: the public page gets TalkingHero as-is; the studio gets the same block
// wrapped in its canvas controls. The editor half is loaded on demand with SSR off, so the
// public bundle never carries @measured/puck's hooks (usePuck throws outside <Puck>).

import dynamic from "next/dynamic";
import TalkingHero, { type TalkingHeroProps } from "./TalkingHero";

const TalkingHeroEdit = dynamic(() => import("./TalkingHeroEdit"), { ssr: false });

export default function TalkingHeroSwitch(props: Partial<TalkingHeroProps> & { id: string; editing?: boolean }) {
  const { editing, id, ...rest } = props;
  if (editing) return <TalkingHeroEdit id={id} {...rest} />;
  return <TalkingHero {...rest} />;
}
