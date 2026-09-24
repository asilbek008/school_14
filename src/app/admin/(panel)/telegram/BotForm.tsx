import AdminForm from "@/components/admin/AdminForm";
import { Field, inputClass } from "@/components/admin/fields";
import { saveBot } from "./actions";

/** Token field only; the saved token is never sent back to the browser. */
export default function BotForm({ connected }: { connected: boolean }) {
  return (
    <AdminForm action={saveBot} submitLabel={connected ? "Tokenni almashtirish" : "Botni ulash"}>
      <Field label="Bot tokeni" hint="@BotFather bergan token. U faqat serverda saqlanadi va hech kimga ko‘rsatilmaydi.">
        <input
          name="bot_token"
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
