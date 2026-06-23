import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProjectEditor from "./ProjectEditor";
import AdminChrome from "../../AdminChrome";
import { signOut } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ProjectEditPage({ params, searchParams }) {
  const { slug } = await params;
  const { notice } = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login?error=env");

  const [userResult, accessResult] = await Promise.all([supabase.auth.getUser(), supabase.rpc("is_portfolio_admin")]);
  const user = userResult.data.user;

  if (!user) redirect("/admin/login");
  if (accessResult.error || accessResult.data !== true) redirect("/admin");

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
    <AdminChrome activeSection="projects" email={user.email} signOut={signOut}>
      <ProjectEditor
        project={project}
        isNew={isNew}
        initialToast={
          notice === "project-created"
            ? { message: "Кейс добавлен", type: "success" }
            : notice === "project-updated"
              ? { message: "Кейс обновлён", type: "success" }
              : null
        }
      />
    </AdminChrome>
  );
}
