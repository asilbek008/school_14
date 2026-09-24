import AdminForm from "@/components/admin/AdminForm";
import { Field, FormSection, inputClass } from "@/components/admin/fields";
import { toTashkentInput } from "@/lib/format";
import { saveTelegram } from "./actions";

export type TelegramSettings = {
  channel: string | null;
  enabled: boolean;
  auto_publish: boolean;
  import_since: string;
};

export default function TelegramForm({ settings }: { settings: TelegramSettings }) {
  return (
    <AdminForm action={saveTelegram}>
      <FormSection title="Kanal">
        <Field label="Telegram kanal" hint="Kanal ochiq (public) bo‘lishi kerak. Masalan: @maktab14 yoki https://t.me/maktab14">
          <input name="channel" defaultValue={settings.channel ? `@${settings.channel}` : ""} placeholder="@kanal_nomi" className={`${inputClass} max-w-sm`} />
        </Field>
        <Field label="Qaysi sanadan boshlab olinsin" hint="Bundan oldingi postlar saytga olinmaydi.">
          <input type="datetime-local" name="import_since" required defaultValue={toTashkentInput(settings.import_since)} className={`${inputClass} max-w-xs`} />
        </Field>
      </FormSection>

      <FormSection title="Sozlamalar">
        <label className="flex items-start gap-2 text-sm font-medium text-slate-800">
          <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="mt-0.5 size-4" />
          <span>
            Avtomatik olish yoqilgan
            <span className="block font-normal text-slate-500">Har 15 daqiqada kanal tekshiriladi.</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm font-medium text-slate-800">
          <input type="checkbox" name="auto_publish" defaultChecked={settings.auto_publish} className="mt-0.5 size-4" />
          <span>
            Darhol saytda ko‘rsatish
            <span className="block font-normal text-slate-500">
              O‘chirilsa, postlar yashirin holda qo‘shiladi — pastdagi ro‘yxatda «Tekshirish kutilmoqda» filtri bilan topib, tekshirib yoqasiz.
            </span>
          </span>
        </label>
      </FormSection>
    </AdminForm>
  );
}
