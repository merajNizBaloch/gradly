"use client";

export default function RemarksFields({
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
  const fieldClass = "mt-2 min-h-24 w-full resize-y rounded-xl border border-[#d8dde4] bg-white px-3.5 py-3 text-sm font-medium leading-6 text-slate-700 outline-none transition focus:border-[#0F4AA8] focus:ring-4 focus:ring-[#1D9BF0]/10";

  return (
    <div className="rounded-2xl border border-[#d8dde4] bg-[#f8fbff] p-4">
      <div className="mb-4">
        <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#11B8B2]">Result remarks</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">These remarks are saved with this student. Teacher remarks appear on the printed result card, with principal remarks beside them.</p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Teacher remarks</span>
          <textarea
            value={teacher}
            onChange={(event) => onTeacherChange(event.target.value)}
            placeholder="Add the class teacher's comment. Leave empty to use Gradly's automatic remark."
            className={fieldClass}
          />
          <span className="mt-1.5 block text-[9px] text-slate-400">Shown on the result card.</span>
        </label>

        <label className="block">
          <span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Principal remarks</span>
          <textarea
            value={principal}
            onChange={(event) => onPrincipalChange(event.target.value)}
            placeholder="Add an optional principal / head teacher comment."
            className={fieldClass}
          />
        </label>
      </div>
    </div>
  );
}
