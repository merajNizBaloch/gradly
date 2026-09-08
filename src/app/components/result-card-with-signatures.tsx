"use client";

import type { ComponentProps, CSSProperties } from "react";
import ResultCard from "./result-card";

type Props = ComponentProps<typeof ResultCard> & {
  teacherSignature?: string;
  principalSignature?: string;
  exportId?: string;
};

export default function ResultCardWithSignatures({
  teacherSignature = "",
  principalSignature = "",
  exportId,
  ...cardProps
}: Props) {
  const style = {
    "--gradly-teacher-signature": teacherSignature ? `url("${teacherSignature}")` : "none",
    "--gradly-principal-signature": principalSignature ? `url("${principalSignature}")` : "none",
  } as CSSProperties & Record<string, string>;

  return (
    <div className="gradly-signature-scope" data-gradly-export-id={exportId} style={style}>
      <style jsx global>{`
        .gradly-signature-scope .gradly-paper .mt-auto.pt-12 > div > div.w-40 {
          position: relative;
        }
        .gradly-signature-scope .gradly-paper .mt-auto.pt-12 > div > div.w-40::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: calc(100% + 3px);
          height: 38px;
          background-repeat: no-repeat;
          background-position: center bottom;
          background-size: contain;
          pointer-events: none;
        }
        .gradly-signature-scope .gradly-paper .mt-auto.pt-12 > div > div.w-40:first-child::before {
          background-image: var(--gradly-teacher-signature);
        }
        .gradly-signature-scope .gradly-paper .mt-auto.pt-12 > div > div.w-40:last-child::before {
          background-image: var(--gradly-principal-signature);
        }
      `}</style>
      <ResultCard {...cardProps} />
    </div>
  );
}
