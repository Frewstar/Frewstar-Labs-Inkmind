export const metadata = {
  title: "Pending Designs | Admin | InkMind",
  description: "Review and manage pending tattoo designs.",
};

export default function PendingDesignsPage() {
  return (
    <>
      <h1 className="font-[var(--font-head)] text-2xl font-semibold text-[var(--white)]">
        Pending Designs
      </h1>
      <p className="mt-2 text-[var(--grey)]">
        Designs awaiting review will appear here.
      </p>
    </>
  );
}
