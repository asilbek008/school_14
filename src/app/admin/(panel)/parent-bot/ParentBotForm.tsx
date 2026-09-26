import AdminForm from "@/components/admin/AdminForm";
import { Field, inputClass } from "@/components/admin/fields";
import { saveParentBot } from "./actions";

/** Token field only; the saved token is never sent back to the browser. */
export default function ParentBotForm({ connected }: { connected: boolean }) {
  return (
    <AdminForm action={saveParentBot} submitLabel={connected ? "Tokenni almashtirish" : "Botni ulash"}>
      <Field label="Ota-onalar boti tokeni" hint="@BotFather bergan token. U faqat serverda saqlanadi va hech kimga ko‘rsatilmaydi.">
        <input
          name="parent_bot_token"
          type="password"
          autoComplete="off"
          required
          placeholder={connected ? "•••••••• (saqlangan)" : "123456789:AAH…"}
          className={`${inputClass} block max-w-md font-mono`}
        />
      </Field>
    </AdminForm>
  );
}
