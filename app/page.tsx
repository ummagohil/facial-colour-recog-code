import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-6">
        Facial Expression Colour Mapper
      </h1>
      <p className="text-lg mb-8 max-w-2xl">
        This app detects your facial expressions in real-time and changes the
        background colour accordingly. Try smiling, frowning, or showing
        surprise!
      </p>

      <div className="mt-4">
        <Link href="/huggingface">
          <Button size="lg" className="min-w-[200px]">
            Start Expression Detection
          </Button>
        </Link>
      </div>
    </main>
  );
}
