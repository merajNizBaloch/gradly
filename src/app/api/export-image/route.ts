import { NextRequest } from "next/server";

const ALLOWED_HOST_SUFFIXES = [".supabase.co", ".supabase.in"];

function isAllowedImageUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return ALLOWED_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url") || "";

  if (!isAllowedImageUrl(target)) {
    return new Response("Unsupported image source", { status: 400 });
  }

  try {
    const response = await fetch(target, {
      cache: "force-cache",
      headers: { Accept: "image/*" },
    });

    if (!response.ok) {
      return new Response("Unable to fetch image", { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) {
      return new Response("Source is not an image", { status: 415 });
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("Unable to fetch image", { status: 502 });
  }
}
