import { NextRequest, NextResponse } from "next/server";
import { JobListing } from "@/types";

export const runtime = "nodejs";

const ADZUNA_COUNTRY = process.env.ADZUNA_COUNTRY || "in"; // "in" = India. Use "us", "gb" etc as needed.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const location = searchParams.get("location") ?? "";
    const keywordsParam = searchParams.get("keywords") ?? "";
    const keywords = keywordsParam
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    if (!role) {
      return NextResponse.json({ error: "Missing role parameter." }, { status: 400 });
    }

    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) {
      return NextResponse.json(
        {
          error:
            "Job search isn't configured yet. Add ADZUNA_APP_ID and ADZUNA_APP_KEY (free at developer.adzuna.com) to your environment variables.",
        },
        { status: 501 }
      );
    }

    const url = new URL(
      `https://api.adzuna.com/v1/api/jobs/${ADZUNA_COUNTRY}/search/1`
    );
    url.searchParams.set("app_id", appId);
    url.searchParams.set("app_key", appKey);
    url.searchParams.set("what", role);
    if (location) url.searchParams.set("where", location);
    url.searchParams.set("results_per_page", "12");
    url.searchParams.set("content-type", "application/json");

    const res = await fetch(url.toString(), { next: { revalidate: 900 } });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Adzuna API error (${res.status}): ${text.slice(0, 300)}`);
    }
    const data = await res.json();

    const listings: JobListing[] = (data.results ?? []).map((job: any) => {
      const description: string = (job.description ?? "").toLowerCase();
      const title: string = (job.title ?? "").toLowerCase();
      const haystack = `${title} ${description}`;
      const matchedCount = keywords.filter((k) => haystack.includes(k)).length;
      const matchPercent =
        keywords.length > 0
          ? Math.round((matchedCount / keywords.length) * 100)
          : 50;

      return {
        id: String(job.id),
        title: job.title,
        company: job.company?.display_name ?? "Unknown company",
        location: job.location?.display_name ?? location ?? "Not specified",
        url: job.redirect_url,
        postedAt: job.created ?? null,
        source: "Adzuna",
        matchPercent: Math.min(99, Math.max(20, matchPercent)),
        salary:
          job.salary_min && job.salary_max
            ? `₹${Math.round(job.salary_min / 1000)}k – ₹${Math.round(job.salary_max / 1000)}k`
            : null,
      };
    });

    listings.sort((a, b) => b.matchPercent - a.matchPercent);

    return NextResponse.json({ jobs: listings });
  } catch (err: any) {
    console.error("[/api/jobs] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Could not fetch job listings." },
      { status: 500 }
    );
  }
}
