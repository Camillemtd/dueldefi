import { OpenTestTradeForm } from "@/components/open-test-trade";
import { SignupForm } from "@/components/signup-form";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12 px-4 py-16">
      <SignupForm />
      <OpenTestTradeForm />
    </main>
  );
}
