import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Compass, LogOut, Package, Plus, Hotel, Route } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Dashboard",
  description: "TourCraft admin dashboard — manage your travel packages.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";

  const quickLinks = [
    {
      href: "/dashboard/packages",
      icon: Package,
      title: "Travel Packages",
      description: "Manage quotation packages — itineraries, hotels, vehicles.",
      color: "bg-indigo-500",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      textColor: "text-indigo-600",
    },
    {
      href: "/dashboard/itineraries",
      icon: Route,
      title: "Itineraries",
      description: "Create and manage day-by-day itineraries with pricing & schedules.",
      color: "bg-violet-500",
      bg: "bg-violet-50",
      border: "border-violet-100",
      textColor: "text-violet-600",
    },
    ...(isAdmin
      ? [
          {
            href: "/dashboard/packages/new",
            icon: Plus,
            title: "New Package",
            description: "Create a new travel package with day-by-day itinerary.",
            color: "bg-sky-500",
            bg: "bg-sky-50",
            border: "border-sky-100",
            textColor: "text-sky-600",
          },
          {
            href: "/dashboard/accommodation",
            icon: Hotel,
            title: "Accommodation",
            description: "Manage cities, hotels, room types, pricing & activities.",
            color: "bg-emerald-500",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            textColor: "text-emerald-600",
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Compass className="w-[15px] h-[15px] text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold text-gray-900 tracking-tight">
            TourCraft
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-gray-500 hidden sm:block">
            {session.user.name}
            <span className="ml-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium capitalize">
              {session.user.role}
            </span>
          </span>
          <a
            href="/api/auth/signout"
            className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">
            Welcome back, {session.user.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Here&apos;s your dashboard. Manage travel packages and quotations from here.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex items-start gap-4 p-5 rounded-2xl border ${link.border} ${link.bg} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className={`w-10 h-10 rounded-xl ${link.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[14px] font-bold ${link.textColor} group-hover:underline`}>
                    {link.title}
                  </p>
                  <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                    {link.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Auth status card */}
        <div className="px-5 py-4 bg-white border border-gray-100 rounded-2xl text-[13px] text-gray-600 flex items-center gap-3 shadow-sm">
          <span className="text-emerald-500 text-[16px]">✓</span>
          <span>
            Authenticated as <strong>{session.user.email}</strong> · Session expires in 7 days
          </span>
        </div>
      </main>
    </div>
  );
}
