"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./admin.module.css";

function SortButton({ attributes, listeners }) {
  return (
    <button className={styles.dragHandle} type="button" aria-label="Перетащить" {...attributes} {...listeners}>
      ::
    </button>
  );
}

function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.listRow} ${isDragging ? styles.dragging : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <SortButton attributes={attributes} listeners={listeners} />
      {children}
    </div>
  );
}

function SortableTile({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.archiveTile} ${isDragging ? styles.dragging : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className={styles.tileDrag}>
        <SortButton attributes={attributes} listeners={listeners} />
      </div>
      {children}
    </div>
  );
}

function reorderFormData(name, ids) {
  const formData = new FormData();
  ids.forEach((id) => formData.append(name, id));
  return formData;
}

function useAdminSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
}

function PreviewImage({ src, alt, className }) {
  if (!src) return <div className={`${styles.previewFallback} ${className || ""}`}>Нет фото</div>;
  return <img className={className} src={src} alt={alt || ""} loading="lazy" />;
}

export default function AdminDashboard({
  content,
  saveAboutSlide,
  deleteAboutSlide,
  reorderAboutSlides,
  reorderProjects,
  saveArchiveItem,
  deleteArchiveItem,
  reorderArchiveItems,
  saveSocialLink,
  deleteSocialLink
}) {
  return (
    <div className={styles.workspace}>
      <nav className={styles.navRail} aria-label="Разделы админки">
        <a href="#about">Фото</a>
        <a href="#projects">Кейсы</a>
        <a href="#archive">Архив</a>
        <a href="#social">Соцсети</a>
      </nav>
      <div className={styles.sections}>
        <AboutSection
          slides={content.slides}
          saveAboutSlide={saveAboutSlide}
          deleteAboutSlide={deleteAboutSlide}
          reorderAboutSlides={reorderAboutSlides}
        />
        <ProjectsSection projects={content.projects} reorderProjects={reorderProjects} />
        <ArchiveSection
          items={content.designArchive}
          saveArchiveItem={saveArchiveItem}
          deleteArchiveItem={deleteArchiveItem}
          reorderArchiveItems={reorderArchiveItems}
        />
        <SocialSection links={content.socialLinks} saveSocialLink={saveSocialLink} deleteSocialLink={deleteSocialLink} />
      </div>
    </div>
  );
}

function AboutSection({ slides, saveAboutSlide, deleteAboutSlide, reorderAboutSlides }) {
  const [items, setItems] = useState(slides);
  const [isPending, startTransition] = useTransition();
  const sensors = useAdminSensors();
  const ids = useMemo(() => items.map((item) => item.id), [items]);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((current) => {
      const next = arrayMove(
        current,
        current.findIndex((item) => item.id === active.id),
        current.findIndex((item) => item.id === over.id)
      );
      startTransition(() => reorderAboutSlides(reorderFormData("ids", next.map((item) => item.id))));
      return next;
    });
  }

  return (
    <section id="about" className={styles.panel}>
      <div className={styles.sectionHead}>
        <div>
          <p className={styles.kicker}>About photos</p>
          <h2>Обо мне</h2>
        </div>
        <p>{isPending ? "Сохраняю порядок..." : "Загрузка, удаление и порядок фото."}</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className={styles.list}>
            {items.map((slide, index) => (
              <SortableRow key={slide.id} id={slide.id}>
                <PreviewImage className={styles.rowImage} src={slide.image_url} alt={slide.alt} />
                <form action={saveAboutSlide} className={styles.rowForm}>
                  <input name="id" type="hidden" defaultValue={slide.id} />
                  <input name="position" type="hidden" value={index} readOnly />
                  <input name="alt" type="hidden" defaultValue={slide.alt || "Фото обо мне"} />
                  <input name="image_current" type="hidden" defaultValue={slide.image_url} />
                  <label className={styles.fileControl}>
                    Заменить
                    <input name="image" type="file" accept="image/*" />
                  </label>
                  <label className={styles.checkbox}>
                    <input name="is_visible" type="checkbox" defaultChecked={slide.is_visible} />
                    На сайте
                  </label>
                  <button type="submit">Сохранить</button>
                  <button formAction={deleteAboutSlide} className={styles.danger} type="submit">
                    Удалить
                  </button>
                </form>
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <form action={saveAboutSlide} className={styles.inlineCreate}>
        <input name="position" type="hidden" value={items.length} readOnly />
        <input name="alt" type="hidden" value="Фото обо мне" readOnly />
        <input name="is_visible" type="hidden" value="on" readOnly />
        <label className={styles.fileControl}>
          Новое фото
          <input name="image" type="file" accept="image/*" required />
        </label>
        <button type="submit">Загрузить</button>
      </form>
    </section>
  );
}

function ProjectsSection({ projects, reorderProjects }) {
  const [items, setItems] = useState(projects);
  const [isPending, startTransition] = useTransition();
  const sensors = useAdminSensors();
  const ids = useMemo(() => items.map((item) => item.slug), [items]);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((current) => {
      const next = arrayMove(
        current,
        current.findIndex((item) => item.slug === active.id),
        current.findIndex((item) => item.slug === over.id)
      );
      startTransition(() => reorderProjects(reorderFormData("slugs", next.map((item) => item.slug))));
      return next;
    });
  }

  return (
    <section id="projects" className={styles.panel}>
      <div className={styles.sectionHead}>
        <div>
          <p className={styles.kicker}>Cases</p>
          <h2>Кейсы</h2>
        </div>
        <Link className={styles.primaryLink} href="/admin/projects/new">
          Новый кейс
        </Link>
      </div>
      <p className={styles.statusLine}>{isPending ? "Сохраняю порядок..." : "Перетащи строки, чтобы поменять порядок на сайте."}</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className={styles.list}>
            {items.map((project) => (
              <SortableRow key={project.slug} id={project.slug}>
                <div className={styles.projectTitle}>
                  <strong>{project.title}</strong>
                  <span>{project.year || "Без года"} / {project.is_visible ? "на сайте" : "скрыт"}</span>
                </div>
                <Link className={styles.rowAction} href={`/admin/projects/${project.slug}`}>
                  Редактировать
                </Link>
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function ArchiveSection({ items: initialItems, saveArchiveItem, deleteArchiveItem, reorderArchiveItems }) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState(null);
  const [isPending, startTransition] = useTransition();
  const sensors = useAdminSensors();
  const ids = useMemo(() => items.map((item) => item.slug), [items]);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((current) => {
      const next = arrayMove(
        current,
        current.findIndex((item) => item.slug === active.id),
        current.findIndex((item) => item.slug === over.id)
      );
      startTransition(() => reorderArchiveItems(reorderFormData("slugs", next.map((item) => item.slug))));
      return next;
    });
  }

  return (
    <section id="archive" className={styles.panel}>
      <div className={styles.sectionHead}>
        <div>
          <p className={styles.kicker}>Design archive</p>
          <h2>Дизайн-архив</h2>
        </div>
        <button type="button" onClick={() => setEditing({ slug: "new", position: items.length, accent: "#77f7c8", is_visible: true })}>
          Новая работа
        </button>
      </div>
      <p className={styles.statusLine}>{isPending ? "Сохраняю порядок..." : "Клик по изображению открывает редактирование."}</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div className={styles.archiveGrid}>
            {items.map((item, index) => (
              <SortableTile key={item.slug} id={item.slug}>
                <button className={styles.archiveButton} type="button" onClick={() => setEditing({ ...item, position: index })}>
                  <PreviewImage className={styles.archiveImage} src={item.image_url} alt={item.title} />
                  <span>{item.title}</span>
                </button>
              </SortableTile>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {editing ? (
        <ArchiveModal
          item={editing}
          saveArchiveItem={saveArchiveItem}
          deleteArchiveItem={deleteArchiveItem}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  );
}

function ArchiveModal({ item, saveArchiveItem, deleteArchiveItem, onClose }) {
  const isNew = item.slug === "new";

  return (
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <form action={saveArchiveItem} className={styles.modalPanel} onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.modalHead}>
          <div>
            <p className={styles.kicker}>{isNew ? "New archive item" : item.slug}</p>
            <h3>{isNew ? "Новая работа" : item.title}</h3>
          </div>
          <button type="button" onClick={onClose}>
            Закрыть
          </button>
        </div>

        <input name="original_slug" type="hidden" defaultValue={item.slug} />
        <input name="position" type="hidden" defaultValue={item.position || 0} />
        <input name="image_current" type="hidden" defaultValue={item.image_url || ""} />
        <div className={styles.modalPreview}>
          <PreviewImage src={item.image_url} alt={item.title} />
        </div>
        <div className={styles.formGrid}>
          <label>
            Название
            <input name="title" defaultValue={item.title || ""} required />
          </label>
          <label>
            Slug
            <input name="slug" defaultValue={isNew ? "" : item.slug} placeholder="auto-from-title" />
          </label>
          <label>
            Accent
            <input name="accent" defaultValue={item.accent || "#77f7c8"} />
          </label>
          <label className={styles.fileControl}>
            Изображение
            <input name="image" type="file" accept="image/*" required={isNew} />
          </label>
        </div>
        <label className={styles.checkbox}>
          <input name="is_visible" type="checkbox" defaultChecked={item.is_visible !== false} />
          Показывать на сайте
        </label>

        <div className={styles.actions}>
          <button type="submit">Сохранить</button>
          {!isNew ? (
            <button formAction={deleteArchiveItem} className={styles.danger} type="submit">
              Удалить
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function SocialSection({ links, saveSocialLink, deleteSocialLink }) {
  return (
    <section id="social" className={`${styles.panel} ${styles.secondaryPanel}`}>
      <div className={styles.sectionHead}>
        <div>
          <p className={styles.kicker}>Footer links</p>
          <h2>Соцсети</h2>
        </div>
      </div>
      <div className={styles.socialList}>
        {links.map((link, index) => (
          <form key={link.label} action={saveSocialLink} className={styles.socialRow}>
            <input name="position" type="hidden" defaultValue={index} />
            <label>
              Label
              <input name="label" defaultValue={link.label} required />
            </label>
            <label>
              URL
              <input name="href" defaultValue={link.href} required />
            </label>
            <label className={styles.checkbox}>
              <input name="is_visible" type="checkbox" defaultChecked={link.is_visible} />
              На сайте
            </label>
            <button type="submit">Сохранить</button>
            <button formAction={deleteSocialLink} className={styles.danger} type="submit">
              Удалить
            </button>
          </form>
        ))}
        <form action={saveSocialLink} className={styles.socialRow}>
          <input name="position" type="hidden" defaultValue={links.length} />
          <label>
            Label
            <input name="label" required />
          </label>
          <label>
            URL
            <input name="href" required />
          </label>
          <label className={styles.checkbox}>
            <input name="is_visible" type="checkbox" defaultChecked />
            На сайте
          </label>
          <button type="submit">Добавить</button>
        </form>
      </div>
    </section>
  );
}
