// This route is no longer used — the tab bar only exposes the login screen.
// Redirect anything that lands here back to the root tab.
import { Redirect } from "expo-router";
export default function TabTwoRedirect() {
  return <Redirect href="/(tabs)" />;
}
