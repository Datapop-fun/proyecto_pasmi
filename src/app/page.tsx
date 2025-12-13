import { LoginScreen } from "@/components/LoginScreen";
import { AppProviders } from "@/state/providers";

export default function Home() {
  return (
    <AppProviders>
      <LoginScreen />
    </AppProviders>
  );
}
