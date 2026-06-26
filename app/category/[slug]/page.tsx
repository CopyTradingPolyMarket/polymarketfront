// app/category/[category]/page.tsx
//
// Adjust the import path below to wherever you place CategoryPage.tsx.
import CategoryPage from "@/src/components/CategoryPage";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // Next 15: params is async. (await works on plain objects too.)
  return <CategoryPage category={decodeURIComponent(slug)} />;
}
