import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="font-display text-6xl text-graphite">404</p>
      <p className="mt-3 text-[15px] text-grey">That page doesn&rsquo;t exist.</p>
      <Link href="/" className="mt-6 text-[13px] font-medium text-graphite underline underline-offset-2">
        Back home
      </Link>
    </div>
  );
}
