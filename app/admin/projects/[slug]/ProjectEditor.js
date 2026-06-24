"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteProject, saveProject } from "../../actions";
import { AdminToastProvider, useAdminToast } from "../../AdminToast";
import { removeMediaByUrl, uploadMediaFile, validateMediaFile } from "@/lib/supabase/upload";
import { ArrowIcon } from "../../AdminChrome";
import styles from "../../admin.module.css";

const VIDEO_URL_PATTERN = /\.(mp4|webm|mov|m4v|ogv)(?:$|[?#])/i;
const REQUIRED_FIELDS = ["title", "year", "category", "descriptor", "role", "technologies", "summary"];

function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9а-яё-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function isVideoUrl(src) {
  return typeof src === "string" && VIDEO_URL_PATTERN.test(src);
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

function GalleryItem({ url, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  return (
    <div ref={setNodeRef} className={`${styles.mediaTile} ${isDragging ? styles.dragging : ""}`} style={{ transform: CSS.Transform.toString(transform), transition }}>
      {isVideoUrl(url) ? <video src={url} playsInline preload="metadata" /> : <Image src={url} alt="Медиа кейса" width={640} height={480} loading="lazy" unoptimized />}
      <button className={styles.mediaDrag} type="button" aria-label="Изменить порядок" {...attributes} {...listeners}><DragIcon /></button>
      <button className={styles.mediaRemove} type="button" aria-label="Удалить медиа" onClick={() => onRemove(url)}>×</button>
    </div>
  );
}

function Field({ label, name, error, children, hint, className = "" }) {
  return (
    <label className={`${styles.field} ${error ? styles.fieldInvalid : ""} ${className}`}>
      <span>{label}</span>
      {children}
      {error ? <small className={styles.fieldError}>{error}</small> : hint ? <small>{hint}</small> : null}
    </label>
  );
}

export default function ProjectEditor(props) {
  return <AdminToastProvider initialToast={props.initialToast}><Editor {...props} /></AdminToastProvider>;
}

function Editor({ project, isNew }) {
  const router = useRouter();
  const showToast = useAdminToast();
  const formRef = useRef(null);
  const [title, setTitle] = useState(project.title || "");
  const [slug, setSlug] = useState(isNew ? "" : project.slug);
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [cover, setCover] = useState(project.image_url || "");
  const [coverState, setCoverState] = useState({ status: "idle", progress: 0, error: "" });
  const [gallery, setGallery] = useState(project.gallery || []);
  const [queue, setQueue] = useState([]);
  const [errors, setErrors] = useState({});
  const [saveState, setSaveState] = useState("clean");
  const [message, setMessage] = useState("Все сохранено");
  const fileInputRef = useRef(null);
  const draftFolder = `drafts/projects/${project.position || 0}`;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const galleryIds = useMemo(() => gallery, [gallery]);
  const uploadBusy = coverState.status === "uploading" || queue.some((item) => item.status === "queued" || item.status === "uploading");

  useEffect(() => {
    if (saveState !== "dirty" && saveState !== "error") return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  function markDirty() {
    if (saveState !== "saving") {
      setSaveState("dirty");
      setMessage("Не сохранено");
    }
  }

  function handleTitle(value) {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
    markDirty();
  }

  async function handleCover(file) {
    const validation = validateMediaFile(file, "image");
    if (validation) {
      setCoverState({ status: "error", progress: 0, error: validation });
      return;
    }
    setCoverState({ status: "uploading", progress: 0, error: "" });
    try {
      const previousCover = cover;
      const uploaded = await uploadMediaFile(file, {
        folder: `${isNew ? draftFolder : `projects/${project.slug}`}/cover`,
        accept: "image",
        onProgress: (progress) => setCoverState({ status: "uploading", progress, error: "" })
      });
      setCover(uploaded.url);
      setCoverState({ status: "complete", progress: 100, error: "" });
      setErrors((current) => ({ ...current, image: undefined }));
      markDirty();
      if (previousCover.includes("/drafts/")) await removeMediaByUrl(previousCover);
    } catch (error) {
      setCoverState({ status: "error", progress: 0, error: error?.message || "Ошибка загрузки" });
    }
  }

  function updateQueue(id, patch) {
    setQueue((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  async function uploadQueueItem(item) {
    updateQueue(item.id, { status: "uploading", error: "", progress: 0 });
    try {
      const uploaded = await uploadMediaFile(item.file, {
        folder: `${isNew ? draftFolder : `projects/${project.slug}`}/gallery`,
        signal: item.controller.signal,
        onProgress: (progress) => updateQueue(item.id, { progress })
      });
      updateQueue(item.id, { status: "complete", progress: 100, url: uploaded.url });
      setGallery((current) => [...current, uploaded.url]);
      markDirty();
    } catch (error) {
      updateQueue(item.id, {
        status: item.controller.signal.aborted ? "cancelled" : "error",
        error: item.controller.signal.aborted ? "Загрузка отменена" : error?.message || "Ошибка загрузки"
      });
    }
  }

  async function addMedia(files) {
    const entries = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      name: file.name,
      status: validateMediaFile(file) ? "error" : "queued",
      error: validateMediaFile(file) || "",
      progress: 0,
      controller: new AbortController()
    }));
    setQueue((current) => [...current, ...entries]);
    const valid = entries.filter((item) => item.status === "queued");
    let cursor = 0;
    const worker = async () => {
      while (cursor < valid.length) {
        const item = valid[cursor];
        cursor += 1;
        await uploadQueueItem(item);
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, valid.length) }, worker));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function retryUpload(item) {
    const retryItem = { ...item, controller: new AbortController(), status: "queued", error: "", progress: 0 };
    setQueue((current) => current.map((entry) => entry.id === item.id ? retryItem : entry));
    uploadQueueItem(retryItem);
  }

  function cancelUpload(item) {
    item.controller.abort();
    updateQueue(item.id, { status: "cancelled", error: "Загрузка отменена" });
  }

  async function removeGallery(url) {
    setGallery((current) => current.filter((item) => item !== url));
    setQueue((current) => current.filter((item) => item.url !== url));
    markDirty();
    if (url.includes("/drafts/")) await removeMediaByUrl(url);
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    setGallery((current) => arrayMove(current, current.indexOf(active.id), current.indexOf(over.id)));
    markDirty();
  }

  function clientValidate(formData) {
    const next = {};
    REQUIRED_FIELDS.forEach((name) => { if (!String(formData.get(name) || "").trim()) next[name] = "Обязательное поле"; });
    if (!cover) next.image = "Добавь обложку";
    if (!slug) next.slug = "Добавь slug";
    setErrors(next);
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0];
      formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      setSaveState("error");
      setMessage("Проверь поля");
      return false;
    }
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saveState === "saving" || uploadBusy) return;
    const formData = new FormData(event.currentTarget);
    formData.set("image_current", cover);
    formData.delete("cover_file");
    gallery.forEach((url) => formData.append("gallery", url));
    if (!clientValidate(formData)) return;
    setSaveState("saving");
    setMessage(isNew ? "Создаю кейс…" : "Сохраняю…");
    const result = await saveProject(formData);
    if (!result?.ok) {
      setErrors(result?.fieldErrors || {});
      setSaveState("error");
      setMessage(result?.message || "Не удалось сохранить");
      showToast(result?.message || "Не удалось сохранить", "error");
      const first = Object.keys(result?.fieldErrors || {})[0];
      if (first) formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    setSaveState("saved");
    setMessage(result.message);
    showToast(result.message);
    if (result.data.isNew) router.replace(`/admin/projects/${result.data.project.slug}?notice=project-created`);
    else router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("Удалить кейс без возможности восстановления?")) return;
    setSaveState("saving");
    setMessage("Удаляю…");
    const data = new FormData();
    data.set("original_slug", project.slug);
    const result = await deleteProject(data);
    if (!result?.ok) {
      setSaveState("error"); setMessage(result?.message || "Не удалось удалить");
      showToast(result?.message || "Не удалось удалить", "error");
      return;
    }
    router.push("/admin/projects?notice=project-deleted");
  }

  async function cleanupDraftMedia() {
    const draftUrls = [...new Set([cover, ...gallery].filter((url) => url.includes("/drafts/")))];
    await Promise.allSettled(draftUrls.map(removeMediaByUrl));
  }

  async function backClick(event) {
    const hasUnsavedChanges = saveState === "dirty" || saveState === "error";
    if (!hasUnsavedChanges) return;
    event.preventDefault();
    if (!window.confirm("Изменения не сохранены. Уйти со страницы?")) return;
    if (isNew) await cleanupDraftMedia();
    router.push("/admin/projects");
  }

  const stateLabel = saveState === "saving" ? message : saveState === "error" ? message : saveState === "dirty" ? "Не сохранено" : "Все сохранено";

  return (
    <div className={styles.editorPage}>
      <header className={styles.editorTopbar}>
        <Link className={styles.backLink} href="/admin/projects" onClick={backClick}><ArrowIcon />Назад</Link>
        <div className={styles.editorTitle}><h1>{isNew ? "Новый кейс" : title || project.title}</h1><span className={`${styles.saveState} ${styles[`state_${saveState}`]}`}><i />{stateLabel}</span></div>
        <button className={styles.primaryButton} type="submit" form="project-editor" disabled={saveState === "saving" || uploadBusy}>{saveState === "saving" ? "Сохраняю…" : isNew ? "Создать кейс" : "Сохранить"}</button>
      </header>

      <form id="project-editor" ref={formRef} className={styles.editorForm} onSubmit={handleSubmit} onChange={markDirty} noValidate>
        <input name="original_slug" type="hidden" value={project.slug || "new"} readOnly />
        <input name="position" type="hidden" value={project.position || 0} readOnly />
        <input name="image_current" type="hidden" value={cover} readOnly />

        <div className={styles.editorColumns}>
          <div className={styles.editorFields}>
            <section className={styles.formSection}>
              <h2>Основное</h2>
              <Field label="Название кейса" name="title" error={errors.title}><input name="title" value={title} onChange={(event) => handleTitle(event.target.value)} /></Field>
              <div className={styles.twoFields}>
                <Field label="Год" name="year" error={errors.year}><input name="year" defaultValue={project.year || ""} inputMode="numeric" /></Field>
                <Field label="Категория" name="category" error={errors.category}><input name="category" defaultValue={project.category || ""} /></Field>
              </div>
              <Field label="Роль" name="role" error={errors.role}><input name="role" defaultValue={project.role || ""} /></Field>
              <Field label="Инструменты" name="technologies" error={errors.technologies} hint="Через запятую"><input name="technologies" defaultValue={(project.technologies || []).join(", ")} /></Field>
            </section>

            <section className={styles.formSection}>
              <h2>Описание</h2>
              <Field label="Короткое описание" name="descriptor" error={errors.descriptor}><textarea name="descriptor" defaultValue={project.descriptor || ""} rows={3} /></Field>
              <Field label="Полное описание" name="summary" error={errors.summary}><textarea name="summary" defaultValue={project.summary || ""} rows={8} /></Field>
            </section>

            <section className={styles.formSection}>
              <h2>Публикация</h2>
              <Field label="Slug" name="slug" error={errors.slug} hint={`lnsnostylist.ru/${slug || "case"}`}><input name="slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); markDirty(); }} /></Field>
              <Field label="Ссылка на проект" name="live_url"><input name="live_url" type="url" defaultValue={project.live_url || ""} placeholder="https://" /></Field>
              <Field label="Акцентный цвет" name="accent"><input name="accent" defaultValue={project.accent || "#77f7c8"} /></Field>
              <label className={styles.switchLabel}><input name="is_visible" type="checkbox" defaultChecked={project.is_visible !== false} /><span />Показывать на сайте</label>
            </section>
          </div>

          <aside className={styles.coverPanel}>
            <div className={`${styles.coverPreview} ${errors.image ? styles.coverError : ""}`}>
              {cover ? <Image src={cover} alt={title || "Обложка кейса"} width={1200} height={900} priority unoptimized /> : <div><strong>Обложка</strong><span>JPG, PNG или WebP до 100 МБ</span></div>}
              {coverState.status === "uploading" ? <div className={styles.coverProgress}><span style={{ width: `${coverState.progress}%` }} /></div> : null}
            </div>
            <label className={styles.fileButton}>{cover ? "Заменить обложку" : "Выбрать обложку"}<input name="cover_file" type="file" accept="image/*" onChange={(event) => handleCover(event.target.files?.[0])} /></label>
            {errors.image ? <p className={styles.fieldError}>{errors.image}</p> : coverState.error ? <p className={styles.fieldError}>{coverState.error}</p> : null}
          </aside>
        </div>

        <section className={styles.mediaSection}>
          <header><div><h2>Медиа</h2><p>{gallery.length} файлов в кейсе</p></div><label className={styles.textAction}>+ Добавить медиа<input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={(event) => addMedia(event.target.files)} /></label></header>
          {gallery.length ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={galleryIds} strategy={rectSortingStrategy}>
                <div className={styles.mediaGrid}>{gallery.map((url) => <GalleryItem key={url} url={url} onRemove={removeGallery} />)}</div>
              </SortableContext>
            </DndContext>
          ) : <label className={styles.mediaEmpty}>Перетащи файлы или выбери их<input type="file" accept="image/*,video/*" multiple onChange={(event) => addMedia(event.target.files)} /></label>}

          {queue.length ? <div className={styles.uploadQueue}>{queue.filter((item) => item.status !== "complete").map((item) => (
            <div key={item.id} className={`${styles.uploadRow} ${item.status === "error" || item.status === "cancelled" ? styles.uploadError : ""}`}>
              <div><strong>{item.name}</strong><span>{item.status === "error" || item.status === "cancelled" ? item.error : item.status === "queued" ? "В очереди" : `${item.progress}%`}</span></div>
              <div className={styles.progressTrack}><span style={{ width: `${item.progress}%` }} /></div>
              {item.status === "error" || item.status === "cancelled" ? <button type="button" onClick={() => retryUpload(item)}>Повторить</button> : <button type="button" onClick={() => cancelUpload(item)}>Отменить</button>}
            </div>
          ))}</div> : null}
        </section>
      </form>

      <footer className={`${styles.editorStatusbar} ${errors && Object.keys(errors).length ? styles.statusError : ""}`}>
        <span>{Object.keys(errors).length ? `${Object.keys(errors).length} поля требуют внимания` : stateLabel}</span>
        {!isNew ? <button className={styles.textDanger} type="button" onClick={handleDelete}>Удалить кейс</button> : null}
      </footer>
    </div>
  );
}
