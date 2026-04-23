"use client";

import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { AnchorHTMLAttributes, MouseEvent } from "react";

import { useUiStore } from "@/store/ui";

type Props = LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>;

export function AppLink({ onClick, href, ...props }: Props) {
  const router = useRouter();
  const startNavigation = useUiStore((state) => state.startNavigation);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      props.target === "_blank" ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    startNavigation();
  };

  return (
    <Link
      href={href}
      {...props}
      onClick={handleClick}
      onMouseEnter={(event) => {
        props.onMouseEnter?.(event);
        if (typeof href === "string") {
          router.prefetch(href);
        }
      }}
    />
  );
}
