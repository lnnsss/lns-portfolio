"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AdminToastProvider, useAdminToast } from "./AdminToast";
import styles from "./admin.module.css";

const sectionCopy = {
  projects: { title: "Кейсы", description: "Порядок и видимость работ на сайте." },
  photos: { title: "Фото", description: "Фотографии в блоке «Обо мне»." },
  archive: { title: "Архив", description: "Небольшие работы и визуальные эксперименты." },
  social: { title: "Соцсети", description: "Ссылки в нижней части сайта." }
};

function SubmitButton({ children, className, pendingLabel = "Сохраняю…", ...props }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending} aria-busy={pending} {...props}>{pending ? pendingLabel : children}</button>;
}

function DragIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="6" cy="4" r="1" /><circle cx="12" cy="4" r="1" />
      <circle cx="6" cy="9" r="1" /><circle cx="12" cy="9" r="1" />
      <circle cx="6" cy="14" r="1" /><circle cx="12" cy="14" r="1" />
    </svg>
  );
}

function Sortable({ id, className = "", children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} className={`${className} ${isDragging ? styles.dragging : ""}`} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button className={styles.dragHandle} type="button" aria-label="Изменить порядок" {...attributes} {...listeners}><DragIcon /></button>
      {children}
    </div>
  );
}

function Preview({ src, alt, className = "" }) {
  return src ? <Image className={className} src={src} alt={alt || ""} width={640} height={480} loading="lazy" unoptimized /> : <div className={`${styles.previewFallback} ${className}`}>Нет изображения</div>;
}

function reorderData(name, values) {
  const data = new FormData();
  values.forEach((value) => data.append(name, value));
  return data;
}

async function prepareImage(formData, folder) {
  const file = formData.get("image");
  if (!file || typeof file === "string" || file.size === 0) return formData;
  const { uploadMediaFile } = await import("@/lib/supabase/upload");
  const result = await uploadMediaFile(file, { folder, accept: "image" });
  formData.set("image_current", result.url);
  formData.delete("image");
  return formData;
}

function useAdminAction() {
  const router = useRouter();
  const showToast = useAdminToast();
  const [state, setState] = useState({ status: "saved", message: "Все сохранено" });

  const run = useCallback(async (action, formData, options = {}) => {
    setState({ status: "saving", message: options.pendingMessage || "Сохраняю…" });
    try {
      const result = await action(formData);
      if (!result?.ok) {
        setState({ status: "error", message: result?.message || "Не удалось сохранить" });
        showToast(result?.message || "Не удалось сохранить", "error");
        options.onError?.(result);
        return result;
      }
      setState({ status: "saved", message: result.message || "Все сохранено" });
      showToast(result.message || "Сохранено");
      options.onSuccess?.(result.data);
      router.refresh();
      return result;
    } catch (error) {
      const message = error?.message || "Не удалось сохранить";
      setState({ status: "error", message });
      showToast(message, "error");
      options.onError?.({ ok: false, message });
      return { ok: false, message };
    }
  }, [router, showToast]);

  return { run, state };
}

function SectionHeader({ activeSection, state, action }) {
  const copy = sectionCopy[activeSection];
  return (
    <header className={styles.pageHeader}>
      <div>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </div>
      <div className={styles.headerActions}>
        <span className={`${styles.saveState} ${styles[`state_${state.status}`]}`}><i />{state.message}</span>
        {action}
      </div>
    </header>
  );
}

export default function AdminDashboard(props) {
  return (
    <AdminToastProvider initialToast={props.initialToast}>
      <DashboardContent {...props} />
    </AdminToastProvider>
  );
}

function DashboardContent({ activeSection, content, ...actions }) {
  const actionState = useAdminAction();
  const headerAction = activeSection === "projects" ? <Link className={styles.primaryButton} href="/admin/projects/new">+ Новый кейс</Link> : null;
  return (
    <div className={styles.sectionPage}>
      <SectionHeader activeSection={activeSection} state={actionState.state} action={headerAction} />
      {activeSection === "projects" ? <ProjectsSection projects={content.projects} reorderProjects={actions.reorderProjects} actionState={actionState} /> : null}
      {activeSection === "photos" ? <PhotosSection initialItems={content.slides} actions={actions} actionState={actionState} /> : null}
      {activeSection === "archive" ? <ArchiveSection initialItems={content.designArchive} actions={actions} actionState={actionState} /> : null}
      {activeSection === "social" ? <SocialSection initialItems={content.socialLinks} actions={actions} actionState={actionState} /> : null}
    </div>
  );
}

function useSensorsConfig() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
}

function ProjectsSection({ projects, reorderProjects, actionState }) {
  const [items, setItems] = useState(projects);
  const sensors = useSensorsConfig();
  const ids = useMemo(() => items.map((item) => item.slug), [items]);

  async function onDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const previous = items;
    const next = arrayMove(items, items.findIndex((item) => item.slug === active.id), items.findIndex((item) => item.slug === over.id));
    setItems(next);
    await actionState.run(reorderProjects, reorderData("slugs", next.map((item) => item.slug)), { onError: () => setItems(previous) });
  }

  return (
    <section className={styles.openSection}>
      <div className={styles.listHeader}><span>Кейс</span><span>Год</span><span>Видимость</span><span /></div>
      {items.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className={styles.caseList}>
              {items.map((project) => (
                <Sortable key={project.slug} id={project.slug} className={styles.caseRow}>
                  <Link className={styles.caseIdentity} href={`/admin/projects/${project.slug}`}>
                    <Preview src={project.image_url} alt={project.title} className={styles.caseThumb} />
                    <strong>{project.title}</strong>
                  </Link>
                  <span>{project.year || "—"}</span>
                  <span className={styles.visibility}><i className={project.is_visible ? styles.visibleDot : ""} />{project.is_visible ? "Опубликован" : "Скрыт"}</span>
                  <Link className={styles.moreLink} href={`/admin/projects/${project.slug}`} aria-label={`Редактировать ${project.title}`}>•••</Link>
                </Sortable>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : <div className={styles.emptyState}><p>Пока нет кейсов</p><Link href="/admin/projects/new">Создать первый кейс</Link></div>}
    </section>
  );
}

function PhotosSection({ initialItems, actions, actionState }) {
  const [items, setItems] = useState(initialItems);
  const sensors = useSensorsConfig();
  const ids = useMemo(() => items.map((item) => item.id), [items]);

  async function onDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const previous = items;
    const next = arrayMove(items, items.findIndex((item) => item.id === active.id), items.findIndex((item) => item.id === over.id));
    setItems(next);
    await actionState.run(actions.reorderAboutSlides, reorderData("ids", next.map((item) => item.id)), { onError: () => setItems(previous) });
  }

  async function savePhoto(formData) {
    const prepared = await prepareImage(formData, "about");
    return actionState.run(actions.saveAboutSlide, prepared, { onSuccess: (data) => setItems((current) => {
      const exists = current.some((item) => item.id === data.id);
      return exists ? current.map((item) => item.id === data.id ? data : item) : [...current, data];
    }) });
  }

  return (
    <section className={styles.openSection}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className={styles.photoList}>{items.map((photo, index) => (
            <Sortable key={photo.id} id={photo.id} className={styles.photoRow}>
              <Preview src={photo.image_url} alt={photo.alt} className={styles.photoThumb} />
              <form action={savePhoto} className={styles.inlineRowForm}>
                <input name="id" type="hidden" value={photo.id} readOnly /><input name="position" type="hidden" value={index} readOnly />
                <input name="alt" type="hidden" value={photo.alt || "Фото обо мне"} readOnly /><input name="image_current" type="hidden" value={photo.image_url} readOnly />
                <label className={styles.fileButton}>Заменить<input name="image" type="file" accept="image/*" /></label>
                <label className={styles.switchLabel}><input name="is_visible" type="checkbox" defaultChecked={photo.is_visible} /><span />На сайте</label>
                <SubmitButton>Сохранить</SubmitButton>
                <SubmitButton className={styles.textDanger} formAction={(data) => actionState.run(actions.deleteAboutSlide, data, { onSuccess: () => setItems((current) => current.filter((item) => item.id !== photo.id)) })}>Удалить</SubmitButton>
              </form>
            </Sortable>
          ))}</div>
        </SortableContext>
      </DndContext>
      <form action={savePhoto} className={styles.createRow}>
        <input name="position" type="hidden" value={items.length} readOnly /><input name="alt" type="hidden" value="Фото обо мне" readOnly /><input name="is_visible" type="hidden" value="on" readOnly />
        <label className={styles.fileDrop}>+ Добавить фотографию<input name="image" type="file" accept="image/*" required /></label>
        <SubmitButton>Загрузить</SubmitButton>
      </form>
    </section>
  );
}

function ArchiveSection({ initialItems, actions, actionState }) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState(null);
  const sensors = useSensorsConfig();
  const ids = useMemo(() => items.map((item) => item.slug), [items]);

  async function onDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const previous = items;
    const next = arrayMove(items, items.findIndex((item) => item.slug === active.id), items.findIndex((item) => item.slug === over.id));
    setItems(next);
    await actionState.run(actions.reorderArchiveItems, reorderData("slugs", next.map((item) => item.slug)), { onError: () => setItems(previous) });
  }

  return (
    <section className={styles.openSection}>
      <div className={styles.localAction}><button className={styles.primaryButton} type="button" onClick={() => setEditing({ slug: "new", position: items.length, accent: "#77f7c8", is_visible: true })}>+ Новая работа</button></div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div className={styles.archiveGrid}>{items.map((item, position) => (
            <Sortable key={item.slug} id={item.slug} className={styles.archiveItem}>
              <button className={styles.archiveEdit} type="button" onClick={() => setEditing({ ...item, position })}>
                <Preview src={item.image_url} alt={item.title} /><span>{item.title}</span><small>{item.is_visible ? "На сайте" : "Скрыт"}</small>
              </button>
            </Sortable>
          ))}</div>
        </SortableContext>
      </DndContext>
      {editing ? <ArchiveDialog item={editing} actions={actions} actionState={actionState} onClose={() => setEditing(null)} onChange={(data, removed) => {
        setItems((current) => removed ? current.filter((item) => item.slug !== removed) : current.some((item) => item.slug === data.slug) ? current.map((item) => item.slug === data.slug ? data : item) : [...current, data]);
        setEditing(null);
      }} /> : null}
    </section>
  );
}

function ArchiveDialog({ item, actions, actionState, onClose, onChange }) {
  const isNew = item.slug === "new";
  async function save(data) {
    const prepared = await prepareImage(data, `archive/${isNew ? "draft" : item.slug}`);
    return actionState.run(actions.saveArchiveItem, prepared, { onSuccess: (saved) => onChange(saved) });
  }
  return (
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <form action={save} className={styles.modalPanel} onMouseDown={(event) => event.stopPropagation()}>
        <header><h2>{isNew ? "Новая работа" : item.title}</h2><button type="button" onClick={onClose}>Закрыть</button></header>
        <input name="original_slug" type="hidden" value={item.slug} readOnly /><input name="position" type="hidden" value={item.position || 0} readOnly /><input name="image_current" type="hidden" value={item.image_url || ""} readOnly />
        <Preview src={item.image_url} alt={item.title} className={styles.modalImage} />
        <div className={styles.formGrid}>
          <label>Название<input name="title" defaultValue={item.title || ""} required /></label>
          <label>Slug<input name="slug" defaultValue={isNew ? "" : item.slug} /></label>
          <label>Accent<input name="accent" defaultValue={item.accent || "#77f7c8"} /></label>
          <label className={styles.fileButton}>Изображение<input name="image" type="file" accept="image/*" required={isNew} /></label>
        </div>
        <label className={styles.switchLabel}><input name="is_visible" type="checkbox" defaultChecked={item.is_visible !== false} /><span />На сайте</label>
        <footer><SubmitButton>{isNew ? "Добавить" : "Сохранить"}</SubmitButton>{!isNew ? <SubmitButton className={styles.textDanger} formAction={(data) => actionState.run(actions.deleteArchiveItem, data, { onSuccess: () => onChange(null, item.slug) })}>Удалить</SubmitButton> : null}</footer>
      </form>
    </div>
  );
}

function SocialSection({ initialItems, actions, actionState }) {
  const [items, setItems] = useState(initialItems);
  function save(data) {
    return actionState.run(actions.saveSocialLink, data, { onSuccess: (saved) => setItems((current) => current.some((item) => item.label === saved.label) ? current.map((item) => item.label === saved.label ? saved : item) : [...current, saved]) });
  }
  return (
    <section className={styles.openSection}>
      <div className={styles.socialList}>{items.map((link, index) => (
        <form key={link.label} action={save} className={styles.socialRow}>
          <input name="position" type="hidden" value={index} readOnly />
          <label>Название<input name="label" defaultValue={link.label} required /></label>
          <label>URL<input name="href" type="url" defaultValue={link.href} required /></label>
          <label className={styles.switchLabel}><input name="is_visible" type="checkbox" defaultChecked={link.is_visible} /><span />На сайте</label>
          <SubmitButton>Сохранить</SubmitButton>
          <SubmitButton className={styles.textDanger} formAction={(data) => actionState.run(actions.deleteSocialLink, data, { onSuccess: () => setItems((current) => current.filter((item) => item.label !== link.label)) })}>Удалить</SubmitButton>
        </form>
      ))}</div>
      <form action={save} className={`${styles.socialRow} ${styles.newSocial}`}>
        <input name="position" type="hidden" value={items.length} readOnly />
        <label>Новая ссылка<input name="label" placeholder="Instagram" required /></label>
        <label>URL<input name="href" type="url" placeholder="https://" required /></label>
        <input name="is_visible" type="hidden" value="on" /><SubmitButton>Добавить</SubmitButton>
      </form>
    </section>
  );
}
