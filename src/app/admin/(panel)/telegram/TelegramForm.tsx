import AdminForm from "@/components/admin/AdminForm";
import { Field, inputClass } from "@/components/admin/fields";
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
      <Field label="Telegram kanal" hint="Kanal ochiq (public) bo‘lishi kerak. Masalan: @maktab14 yoki https://t.me/maktab14">
        <input name="channel" defaultValue={settings.channel ? `@${settings.channel}` : ""} placeholder="@kanal_nomi" className={`${inputClass} block max-w-sm`} />
      </Field>
      <Field label="Qaysi sanadan boshlab olinsin" hint="Bundan oldingi postlar saytga olinmaydi.">
        <input type="datetime-local" name="import_since" required defaultValue={toTashkentInput(settings.import_since)} className={`${inputClass} block max-w-xs`} />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="size-4" />
        Avtomatik olish yoqilgan (har 15 daqiqada)
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <input type="checkbox" name="auto_publish" defaultChecked={settings.auto_publish} className="size-4" />
        Darhol saytda ko‘rsatish (o‘chirilsa — yashirin holda qo‘shiladi, admin tekshirib yoqadi)
      </label>
    </AdminForm>
  );
}
