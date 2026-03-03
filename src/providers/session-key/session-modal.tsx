"use client";

import { useMemo, useState } from "react";
import { formatFutureDuration, formatRelativeTime } from "@/lib";
import { Check, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_DURATION_DAYS, DURATION_PRESETS } from "./constants";
import { useSessionStore } from "./session-store";
import { useLoginSession, useSessionStatus } from "./use-session";

function SessionBenefits() {
  return (
    <div className="rounded-lg bg-muted p-4 space-y-3">
      <div className="flex items-start gap-2 text-sm">
        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
        <span>File uploads are now seamless</span>
      </div>
      <div className="flex items-start gap-2 text-sm">
        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
        <span>File deletions are now seamless</span>
      </div>
      <div className="flex items-start gap-2 text-sm">
        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
        <span>No wallet popups for transactions</span>
      </div>
    </div>
  );
}

export function SessionModal() {
  const modalOpen = useSessionStore((s) => s.modalOpen);
  const closeModal = useSessionStore((s) => s.closeModal);
  const { status, expiresAt } = useSessionStatus();
  const { mutate: login, isPending } = useLoginSession();

  const [durationDays, setDurationDays] = useState(DEFAULT_DURATION_DAYS);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdDuration, setCreatedDuration] = useState(0);

  const isExtendMode = status === "expiring";
  const now = useMemo(() => BigInt(Math.floor(Date.now() / 1000)), []);
  const isActiveView =
    !showSuccess && status === "valid" && expiresAt !== undefined && expiresAt > now;
  const isFormView = !showSuccess && !isActiveView;

  const handleCreate = () => {
    login(durationDays, {
      onSuccess: () => {
        setCreatedDuration(durationDays);
        setShowSuccess(true);
      },
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setDurationDays(DEFAULT_DURATION_DAYS);
      setShowSuccess(false);
      setCreatedDuration(0);
    } else if (!isPending) {
      closeModal();
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        {...(isFormView
          ? {
              showCloseButton: false,
              onInteractOutside: (e: Event) => e.preventDefault(),
              onEscapeKeyDown: (e: KeyboardEvent) => e.preventDefault(),
            }
          : {})}
      >
        {showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                {isExtendMode ? "Session Extended!" : "Session Created!"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <SessionBenefits />
              <p className="text-sm text-muted-foreground text-center">
                Session expires {formatFutureDuration(createdDuration)}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </>
        ) : isActiveView ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                Session Active
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <SessionBenefits />
              <p className="text-sm text-muted-foreground text-center">
                Session expires {formatRelativeTime(expiresAt!)}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                {isExtendMode ? "Extend Session Key" : "Create Session Key"}
              </DialogTitle>
              <DialogDescription>
                {isExtendMode
                  ? "Your session key is expiring soon. Extend it to continue seamless transactions."
                  : "Sign once to enable seamless transactions without wallet popups."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Session Duration</Label>
                  <span className="text-sm font-medium">
                    {durationDays} {durationDays === 1 ? "day" : "days"}
                  </span>
                </div>
                <Slider
                  value={[durationDays]}
                  onValueChange={([value]) => setDurationDays(value)}
                  min={1}
                  max={31}
                  step={1}
                  disabled={isPending}
                  className="w-full"
                />
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={durationDays === preset.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDurationDays(preset.value)}
                      disabled={isPending}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>No wallet signature required for each transaction</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Session expires {formatFutureDuration(durationDays)}</span>
                </div>
              </div>

              {isExtendMode && !!expiresAt && expiresAt > 0 && (
                <div className="text-sm text-muted-foreground space-y-1 p-3 border rounded-lg">
                  <p>
                    <span className="font-medium">Current session expires:</span>{" "}
                    {formatRelativeTime(expiresAt)}
                  </p>
                  <p>
                    <span className="font-medium">After extension:</span>{" "}
                    {formatFutureDuration(durationDays)}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                Skip for now
              </Button>
              <Button onClick={handleCreate} disabled={isPending} className="w-full sm:w-auto">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isExtendMode ? "Extending..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {isExtendMode ? "Extend Session" : "Create Session"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
