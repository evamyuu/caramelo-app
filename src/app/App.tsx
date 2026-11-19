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
import { RoutineAlert } from "@/features/routine/RoutineAlert";
import { RoutineScreen } from "@/features/routine/RoutineScreen";
import { StoreScreen } from "@/features/store/StoreScreen";
import type { Navigate, ScreenName, TaskIntent } from "@/lib/types";

/** Screen registry. Adding a screen means adding one entry here. */
const SCREENS: Record<ScreenName, ComponentType<{ navigate: Navigate; intent?: TaskIntent }>> = {
  home: HomeScreen,
  apps: AppsScreen,
  listening: ListeningScreen,
  call: CallScreen,
  message: MessageScreen,
  cobrowse: SecureSessionScreen,
  selfie: SelfieGuideScreen,
  medicine: MedicineScreen,
  bank: BankScreen,
  routine: RoutineScreen,
  store: StoreScreen,
};
/** Screens where a routine alert would interrupt something more important. */
const NO_ALERT: ScreenName[] = ["cobrowse", "call", "listening"];

export function App() {
  const [screen, setScreen] = useState<ScreenName>("home");
  const [intent, setIntent] = useState<TaskIntent | undefined>();
  const navigate = useCallback<Navigate>((next, nextIntent) => {
    setIntent(nextIntent);
    setScreen(next);
  }, []);
  const Current = SCREENS[screen];
  return (
    <>
      <Current key={screen} navigate={navigate} intent={intent} />
      <RoutineAlert navigate={navigate} paused={NO_ALERT.includes(screen)} />
    </>
  );
}
