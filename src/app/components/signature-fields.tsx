"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRef } from "react";

async function prepareSignature(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("Could not read signature image."));
    reader.readAsDataURL(file);
  });

  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxWidth = 900;
      const maxHeight = 300;
      const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return resolve(dataUrl);
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function SignatureInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const choose = async (file?: File) => {
    if (!file) return;
    onChange(await prepareSignature(file));
  };

  return (
    <div className="border border-[#D8E3F0] bg-white p-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => choose(event.target.files?.[0])}
      />
      <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p>
      <div className="mt-2 flex min-h-24 items-center justify-center border border-dashed border-[#C9D8E7] bg-[#F8FBFF] px-4 py-3">
        {value ? (
          <img src={value} alt={label} className="max-h-20 max-w-full object-contain" />
        ) : (
          <span className="text-[10px] font-semibold text-slate-400">No signature added</span>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 border border-[#D8E3F0] bg-white px-3 py-2 text-[10px] font-black text-[#0F4AA8]"
        >
          <ImagePlus size={13} /> {value ? "Replace" : "Upload"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="grid min-h-11 w-11 place-items-center border border-rose-100 bg-white text-rose-500"
            title={`Remove ${label.toLowerCase()}`}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function SignatureFields({
  teacher,
  principal,
  onTeacherChange,
  onPrincipalChange,
}: {
  teacher: string;
  principal: string;
  onTeacherChange: (value: string) => void;
  onPrincipalChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-2">
        <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Signatures</p>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">Upload transparent PNGs for the cleanest printed result.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SignatureInput label="Teacher signature" value={teacher} onChange={onTeacherChange} />
        <SignatureInput label="Principal signature" value={principal} onChange={onPrincipalChange} />
      </div>
    </div>
  );
}
