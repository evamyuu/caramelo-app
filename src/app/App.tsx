import { type ComponentType, useCallback, useState } from "react";

import { SecureSessionScreen } from "@/features/cobrowse/SecureSessionScreen";
import { BankScreen } from "@/features/companion/BankScreen";
import { MedicineScreen } from "@/features/companion/MedicineScreen";
import { SelfieGuideScreen } from "@/features/documents/SelfieGuideScreen";
import { CallScreen } from "@/features/guard/CallScreen";
import { MessageScreen } from "@/features/guard/MessageScreen";
import { AppsScreen } from "@/features/home/AppsScreen";
import { HomeScreen } from "@/features/home/HomeScreen";
import { ListeningScreen } from "@/features/home/ListeningScreen";
import type { Navigate, ScreenName } from "@/lib/types";

/** Screen registry. Adding a screen means adding one entry here. */
const SCREENS: Record<ScreenName, ComponentType<{ navigate: Navigate }>> = {
  home: HomeScreen,
  apps: AppsScreen,
  listening: ListeningScreen,
  call: CallScreen,
  message: MessageScreen,
  cobrowse: SecureSessionScreen,
  selfie: SelfieGuideScreen,
  medicine: MedicineScreen,
  bank: BankScreen,
};

export function App() {
  const [screen, setScreen] = useState<ScreenName>("home");
  const navigate = useCallback<Navigate>((next) => setScreen(next), []);
  const Current = SCREENS[screen];
  return <Current key={screen} navigate={navigate} />;
}
