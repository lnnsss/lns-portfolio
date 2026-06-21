import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProjectEditor from "./ProjectEditor";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

async function isAdmin(supabase) {
  const { data, error } = await supabase.rpc("is_portfolio_admin");
  return !error && data === true;
}

export default async function ProjectEditPage({ params }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login?error=env");

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  if (!(await isAdmin(supabase))) redirect("/admin");

  const isNew = slug === "new";
  let project = {
    slug: "new",
    position: 0,
    title: "",
    descriptor: "",
    year: "",
    category: "",
    role: "",
    technologies: [],
    live_url: "",
    accent: "#77f7c8",
    image_url: "",
    gallery: [],
    summary: "",
    is_visible: true
  };

  if (isNew) {
    const { count } = await supabase.from("projects").select("slug", { count: "exact", head: true });
    project.position = count || 0;
  } else {
    const { data, error } = await supabase.from("projects").select("*").eq("slug", slug).single();
    if (error || !data) redirect("/admin#projects");
    project = data;
  }

  return (
    <main className={styles.adminShell}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Case editor</p>
          <h1>{isNew ? "Новый кейс" : project.title}</h1>
          <p>{user.email}</p>
        </div>
      </header>
      <ProjectEditor project={project} isNew={isNew} />
    </main>
  );
}
