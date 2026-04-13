import { Redirect } from "expo-router";
import { useActiveAccount } from "thirdweb/react";

export default function Index() {
  const account = useActiveAccount();
  return account ? (
    <Redirect href="/(app)" />
  ) : (
    <Redirect href="/(auth)/login" />
  );
}
