import { useState } from "react";
import { CopyIcon, CopyCheckIcon } from "lucide-react";

export const CopyableURL = ({ url }: { url: string | undefined }) => {
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 1000);
    }
  };

  return (
    <div className="relative inline-block">
      <div
        className="cursor-pointer hover:underline flex items-center gap-1"
        style={{ color: "var(--primary)" }}
        onClick={handleCopy}
      >
        <div>{url}</div>
        {isCopied ? (
          <CopyCheckIcon className="w-4 h-4" />
        ) : (
          <CopyIcon className="w-4 h-4" />
        )}
      </div>
      {isCopied && (
        <div
          className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 text-xs rounded shadow-lg z-10 whitespace-nowrap"
          style={{
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        >
          Copied!
          <div
            className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0"
            style={{
              borderTop: "4px solid transparent",
              borderBottom: "4px solid transparent",
              borderRight: "4px solid var(--border)",
            }}
          />
        </div>
      )}
    </div>
  );
};
