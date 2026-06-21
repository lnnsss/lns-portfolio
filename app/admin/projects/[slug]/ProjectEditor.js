"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteProject, saveProject, uploadProjectGalleryFiles } from "../../actions";
import { AdminToastProvider, useAdminToast } from "../../AdminToast";
import styles from "../../admin.module.css";

const VIDEO_URL_PATTERN = /\.(mp4|webm|mov|m4v|ogv)(?:$|[?#])/i;

function isVideoUrl(src) {
  return typeof src === "string" && VIDEO_URL_PATTERN.test(src);
}

function SortableGalleryItem({ image, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.galleryItem} ${isDragging ? styles.dragging : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button className={styles.dragHandle} type="button" aria-label="Перетащить" {...attributes} {...listeners}>
        ::
      </button>
      {children}
    </div>
  );
}

export default function ProjectEditor({ project, isNew, initialToast }) {
  return (
    <AdminToastProvider initialToast={initialToast}>
      <ProjectEditorContent project={project} isNew={isNew} />
    </AdminToastProvider>
  );
}

function ProjectEditorContent({ project, isNew }) {
  const [gallery, setGallery] = useState(project.gallery || []);
  const [coverPreview, setCoverPreview] = useState(project.image_url || "");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef(null);
  const showToast = useAdminToast();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const galleryIds = useMemo(() => gallery, [gallery]);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setGallery((current) =>
      arrayMove(
        current,
        current.findIndex((item) => item === active.id),
        current.findIndex((item) => item === over.id)
      )
    );
  }

  function handleCoverChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleGalleryUpload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const formData = new FormData();
    formData.set("slug", project.slug || project.title || "new-project");
    files.forEach((file) => formData.append("gallery_files", file));

    startTransition(async () => {
      try {
        const urls = await uploadProjectGalleryFiles(formData);
        setGallery((current) => [...current, ...urls]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        showToast(urls.length > 1 ? "Изображения добавлены" : "Изображение добавлено");
      } catch (error) {
        showToast(error?.message || "Не удалось загрузить изображения", "error");
      }
    });
  }

  function removeGalleryImage(image) {
    setGallery((current) => current.filter((item) => item !== image));
    showToast("Изображение удалено из галереи");
  }

  return (
    <form action={saveProject} className={styles.editorForm}>
      <input name="original_slug" type="hidden" defaultValue={project.slug || "new"} />
      <input name="position" type="hidden" defaultValue={project.position || 0} />
      <input name="image_current" type="hidden" defaultValue={project.image_url || ""} />
      {gallery.map((image) => (
        <input key={image} name="gallery" type="hidden" value={image} readOnly />
      ))}

      <div className={styles.editorLayout}>
        <section className={styles.editorMain}>
          <div className={styles.formGrid}>
            <label>
              Название
              <input name="title" defaultValue={project.title || ""} required />
            </label>
            <label>
              Slug
              <input name="slug" defaultValue={isNew ? "" : project.slug} placeholder="auto-from-title" />
            </label>
            <label>
              Год
              <input name="year" defaultValue={project.year || ""} required />
            </label>
            <label>
              Категория
              <input name="category" defaultValue={project.category || ""} required />
            </label>
            <label className={styles.wide}>
              Короткое описание
              <input name="descriptor" defaultValue={project.descriptor || ""} required />
            </label>
            <label className={styles.wide}>
              Роль
              <input name="role" defaultValue={project.role || ""} required />
            </label>
            <label>
              Инструменты
              <input name="technologies" defaultValue={(project.technologies || []).join(", ")} required />
            </label>
            <label>
              Ссылка
              <input name="live_url" defaultValue={project.live_url || ""} />
            </label>
            <label>
              Accent
              <input name="accent" defaultValue={project.accent || "#77f7c8"} required />
            </label>
            <label className={styles.checkbox}>
              <input name="is_visible" type="checkbox" defaultChecked={project.is_visible !== false} />
              Показывать на сайте
            </label>
            <label className={styles.wide}>
              Summary
              <textarea name="summary" defaultValue={project.summary || ""} rows={8} required />
            </label>
          </div>
        </section>

        <aside className={styles.editorSide}>
          <div className={styles.coverBox}>
            {coverPreview ? <img src={coverPreview} alt={project.title || "Обложка кейса"} /> : <span>Нет обложки</span>}
          </div>
          <label className={styles.fileControl}>
            Обложка
            <input name="image" type="file" accept="image/*" required={isNew} onChange={handleCoverChange} />
          </label>
        </aside>
      </div>

      <section className={styles.galleryPanel}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>Media gallery</p>
            <h2>Фото и видео</h2>
          </div>
          <label className={styles.fileControl}>
            Добавить медиа
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleGalleryUpload} />
          </label>
        </div>
        <p className={styles.statusLine}>{isPending ? "Загружаю медиа..." : "Перетащи фото и видео, чтобы поменять порядок."}</p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={galleryIds} strategy={rectSortingStrategy}>
            <div className={styles.galleryGrid}>
              {gallery.map((image) => (
                <SortableGalleryItem key={image} image={image}>
                  {isVideoUrl(image) ? (
                    <video src={image} controls playsInline preload="metadata" aria-label="Видео галереи" />
                  ) : (
                    <img src={image} alt="Изображение галереи" loading="lazy" />
                  )}
                  <button type="button" className={styles.removeImage} onClick={() => removeGalleryImage(image)}>
                    Удалить
                  </button>
                </SortableGalleryItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <div className={styles.stickyActions}>
        <Link href="/admin#projects">Назад</Link>
        <div>
          {!isNew ? (
            <button formAction={deleteProject} className={styles.danger} type="submit">
              Удалить кейс
            </button>
          ) : null}
          <button type="submit">Сохранить кейс</button>
        </div>
      </div>
    </form>
  );
}
