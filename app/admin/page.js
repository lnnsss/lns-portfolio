import { redirect } from "next/navigation";
import { getAdminContent } from "@/lib/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminDashboard from "./AdminDashboard";
import {
  deleteAboutSlide,
  deleteArchiveItem,
  deleteSocialLink,
  reorderAboutSlides,
  reorderArchiveItems,
  reorderProjects,
  saveAboutSlide,
  saveArchiveItem,
  saveSocialLink,
  signOut
} from "./actions";
import styles from "./admin.module.css";

export const metadata = {
  title: "Portfolio admin"
};

export const dynamic = "force-dynamic";

async function isAdmin(supabase) {
  const { data, error } = await supabase.rpc("is_portfolio_admin");
  return !error && data === true;
}

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login?error=env");

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const hasAccess = await isAdmin(supabase);
  const content = hasAccess ? await getAdminContent(supabase) : null;

  return (
    <main className={styles.adminShell}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Portfolio CMS</p>
          <h1>Админка</h1>
          <p>{user.email}</p>
        </div>
        <form action={signOut}>
          <button type="submit">Выйти</button>
        </form>
      </header>

      {!hasAccess ? (
        <section className={styles.notice}>
          <h2>Нет прав на редактирование</h2>
          <p>
            Пользователь вошёл, но RLS не считает его админом. Добавь email в таблицу <code>admin_users</code> или
            поставь <code>portfolio_admin=true</code> в app_metadata пользователя.
          </p>
        </section>
      ) : (
        <AdminDashboard
          content={content}
          saveAboutSlide={saveAboutSlide}
          deleteAboutSlide={deleteAboutSlide}
          reorderAboutSlides={reorderAboutSlides}
          reorderProjects={reorderProjects}
          saveArchiveItem={saveArchiveItem}
          deleteArchiveItem={deleteArchiveItem}
          reorderArchiveItems={reorderArchiveItems}
          saveSocialLink={saveSocialLink}
          deleteSocialLink={deleteSocialLink}
        />
      )}
    </main>
  );
}
