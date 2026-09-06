import { NextResponse } from "next/server";

function isAllowedHost(hostname: string) {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configured) return false;

  try {
    const configuredHost = new URL(configured).hostname;
    return hostname === configuredHost || hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url).searchParams.get("url");
    if (!url) return NextResponse.json({ error: "Missing image URL" }, { status: 400 });

    const target = new URL(url);
    if (target.protocol !== "https:") {
      return NextResponse.json({ error: "Only HTTPS images are supported" }, { status: 400 });
    }

    if (!isAllowedHost(target.hostname)) {
      return NextResponse.json({ error: "Image host is not allowed" }, { status: 403 });
    }

    const response = await fetch(target.toString(), { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: `Image request failed with ${response.status}` }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ error: "The resource is not an image" }, { status: 415 });
    }

    return new NextResponse(await response.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to proxy image" },
      { status: 500 },
    );
  }
}
