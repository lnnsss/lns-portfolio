import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signIn } from "../actions";
import styles from "../admin.module.css";

export const metadata = {
  title: "Admin login"
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }) {
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) redirect("/admin");
  }

  const error = params?.error;

  return (
    <main className={styles.adminShell}>
      <section className={styles.loginPanel}>
        <p className={styles.kicker}>Admin</p>
        <h1>Вход</h1>
        {error === "login" ? <p className={styles.error}>Не получилось войти. Проверь email и пароль.</p> : null}
        <form action={signIn} className={styles.form}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Пароль
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button type="submit">Войти</button>
        </form>
      </section>
    </main>
  );
}
