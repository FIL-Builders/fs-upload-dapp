"use client";

import { Github, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 items-center gap-4 px-6 md:grid-cols-3 md:gap-6">
        <div className="flex items-center justify-center gap-2 font-semibold md:justify-start">
          <a
            href="https://github.com/FilOzone/synapse-sdk"
            target="_blank"
            className="flex items-center gap-2 cursor-pointer hover:scale-120 transition-all duration-300"
          >
            <Github className="size-5 rotate-y-180 cursor-pointer" />
            <span className="font-semibold text-xs">Powered by Synapse SDK</span>
          </a>
        </div>
        <div className="flex items-center justify-center gap-2 font-semibold">
          <span className="font-semibold">Built with</span>
          <Heart className="size-5 text-red-500 fill-red-500 animate-pulse hover:scale-120 cursor-pointer" />
          <span className="font-semibold">from FIL-Builders</span>
        </div>

        <div className="flex items-center justify-center gap-2 font-semibold md:justify-end">
          <a
            href="https://github.com/FIL-Builders/fs-upload-dapp"
            target="_blank"
            className="flex items-center gap-2 hover:scale-120 cursor-pointer text-xs"
          >
            <span className="font-semibold">Fork me</span>
            <Github className="size-5 cursor-pointer" />
          </a>
        </div>
      </div>
    </footer>
  );
}
