import { redirect } from "next/navigation";
import { getAdminContent } from "@/lib/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminDashboard from "./AdminDashboard";
import AdminChrome from "./AdminChrome";
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

export default async function AdminSectionPage({ section, searchParams }) {
  const { notice } = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login?error=env");

  const [userResult, accessResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("is_portfolio_admin")
  ]);
  const user = userResult.data.user;

  if (!user) redirect("/admin/login");

  const hasAccess = !accessResult.error && accessResult.data === true;
  const content = hasAccess ? await getAdminContent(supabase, section) : null;

  return (
    <AdminChrome activeSection={section} email={user.email} signOut={signOut}>
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
          activeSection={section}
          initialToast={notice === "project-deleted" ? { message: "Кейс удалён", type: "success" } : null}
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
    </AdminChrome>
  );
}
