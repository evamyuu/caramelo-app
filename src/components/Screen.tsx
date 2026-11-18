import type { ReactNode } from "react";

import type { AvatarState, Mood } from "@/lib/types";

import { Avatar } from "./Avatar";

interface ScreenProps {
  mood: Mood;
  /** Context chip above the title. */
  chip: string;
  title: ReactNode;
  speech?: string;
  /** Two-line hint next to Caramelo; the second line takes the accent colour. */
  hint: [string, string];
  avatar?: AvatarState;
  onAvatarClick?: () => void;
  /** Home-style layout: content vertically centred, user badge shown. */
  centered?: boolean;
  largeTitle?: boolean;
  onBackgroundClick?: () => void;
  children?: ReactNode;
}

/**
 * Fixed v9 structure shared by every screen: status bar, context chip, large
 * title, Caramelo's sentence, content, and Caramelo with a voice hint at the bottom.
 */
export function Screen(props: ScreenProps) {
  const { mood, chip, title, speech, hint, avatar = "calm", centered, largeTitle, children } = props;
  return (
    <main className="screen" data-mood={mood} onClick={props.onBackgroundClick}>
      <div className="status-bar">9:41</div>
      {centered && <div className="user-badge">M</div>}
      <div className={`screen__body${centered ? " screen__body--centered" : ""}`}>
        <span className="chip">{chip}</span>
        <h1 className={`title${largeTitle ? " title--xl" : ""}`}>{title}</h1>
        {speech && <p className="speech" aria-live="polite">{speech}</p>}
        {children}
      </div>
      <button className="footer" onClick={props.onAvatarClick} aria-label="Falar com o Caramelo">
        <span className="footer__avatar"><Avatar state={avatar} /></span>
        <span className="footer__hint">{hint[0]}<span>{hint[1]}</span></span>
      </button>
    </main>
  );
}
