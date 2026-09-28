import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "telcoqualify-core",
    version: "1.0.0",
    uptimeSeconds: process.uptime()
  });
}
