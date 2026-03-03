"use client";

import Link from "next/link";
import { ArrowRight, Database, FileStack, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickActionProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  disabled?: boolean;
}

function QuickAction({ href, icon: Icon, title, description, disabled = false }: QuickActionProps) {
  const content = (
    <Card
      className={`h-full transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-3 text-sm">{description}</CardDescription>
        <div className="flex items-center text-primary text-sm font-medium">
          Get started <ArrowRight className="ml-1 h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );

  if (disabled) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}

export function QuickActions() {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          href="/upload"
          icon={Upload}
          title="Upload Files"
          description="Store files on Filecoin with automatic payment handling"
        />
        <QuickAction
          href="/files"
          icon={FileStack}
          title="View Files"
          description="Browse all your stored files across datasets"
        />
        <QuickAction
          href="/datasets"
          icon={Database}
          title="Manage Datasets"
          description="View and manage your storage datasets"
        />
      </div>
    </section>
  );
}
